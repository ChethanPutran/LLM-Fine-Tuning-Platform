# app/core/pipeline_engine/executor.py

import asyncio
import inspect
import logging
from typing import Dict, Any, Optional, Callable, List
from uuid import UUID
from datetime import datetime, timezone

from backend.api.routes import pipeline

from .models import Pipeline, PipelineNode, NodeStatus, ResourceAvailability
from backend.common.enums import ExecutionStatus, ExecutionEvent
from .scheduler import PipelineScheduler, SchedulingContext, FIFOScheduler
from .state_manager import PipelineStateManager
from .retry_handler import RetryHandler
from backend.core.pipeline_engine.artifact_resolver import resolve_artifact_refs


logger = logging.getLogger(__name__)


def _normalize_resource_availability(raw) -> ResourceAvailability:
    """
    Accept whatever the resource manager returns and produce a
    ResourceAvailability instance.

    - Already a ResourceAvailability   → return as-is.
    - dict with "cpu"/"memory"/...      → coerce to ResourceAvailability.
    - dict with "memory_gb"             → map to "memory".
    - None / anything else              → zeroed instance.
    """
    if isinstance(raw, ResourceAvailability):
        return raw
    if isinstance(raw, dict):
        return ResourceAvailability(
            cpu=raw.get("cpu") or 0.0,
            memory=raw.get("memory") or raw.get("memory_gb") or 0.0,
            gpu=raw.get("gpu") or 0.0,
            disk=raw.get("disk") or 0.0,
        )
    return ResourceAvailability()


class PipelineExecutor:
    """
    Orchestrates pipeline execution following the Command pattern
    """

    def __init__(
        self,
        state_manager: PipelineStateManager,
        scheduler: Optional[PipelineScheduler] = None,
        retry_handler: Optional[RetryHandler] = None,
    ):
        self.state_manager = state_manager
        self.scheduler = scheduler or PipelineScheduler(FIFOScheduler())
        self.retry_handler = retry_handler or RetryHandler()
        self._event_handlers: Dict[ExecutionEvent, List[Callable]] = {
            event: [] for event in ExecutionEvent
        }
        self._running_pipelines: Dict[UUID, asyncio.Task] = {}
        self._node_handlers: Dict[str, Callable] = {}

    # ------------------------------------------------------------------
    # Event registration (unchanged)
    # ------------------------------------------------------------------

    def on(self, event: ExecutionEvent):
        def decorator(handler: Callable) -> Callable:
            self._event_handlers[event].append(handler)
            logger.debug(f"Registered handler for event: {event.value}")
            return handler
        return decorator

    def register_handler(self, event: ExecutionEvent, handler: Callable) -> "PipelineExecutor":
        self._event_handlers[event].append(handler)
        logger.debug(f"Registered handler for event: {event.value}")
        return self

    def once(self, event: ExecutionEvent):
        def decorator(handler: Callable) -> Callable:
            async def wrapper(data):
                if inspect.iscoroutinefunction(handler):
                    await handler(data)
                else:
                    handler(data)
                if wrapper in self._event_handlers[event]:
                    self._event_handlers[event].remove(wrapper)

            self._event_handlers[event].append(wrapper)
            return handler
        return decorator

    def remove_handler(self, event: ExecutionEvent, handler: Callable) -> bool:
        if handler in self._event_handlers[event]:
            self._event_handlers[event].remove(handler)
            logger.debug(f"Removed handler for event: {event.value}")
            return True
        return False

    def clear_handlers(self, event: Optional[ExecutionEvent] = None):
        if event:
            self._event_handlers[event].clear()
        else:
            for e in ExecutionEvent:
                self._event_handlers[e].clear()

    async def _emit_event(self, event: ExecutionEvent, data: Dict[str, Any]):
        handlers = self._event_handlers.get(event, [])
        if not handlers:
            return
        for handler in handlers:
            try:
                if inspect.iscoroutinefunction(handler):
                    await handler(data)
                else:
                    handler(data)
            except Exception as e:
                logger.error(
                    f"Error in event handler for {event.value}: {e}",
                    exc_info=True,
                )

    def register_node_handler(self, node_type: str, handler: Callable) -> "PipelineExecutor":
        self._node_handlers[node_type] = handler
        logger.info(f"Registered handler for node type: {node_type}")
        return self

    # ------------------------------------------------------------------
    # Main execution
    # ------------------------------------------------------------------

    async def execute_pipeline(
        self,
        pipeline: Pipeline,
        execution_id: UUID,
        resource_availability,
    ) -> Dict[str, Any]:
        """Execute pipeline asynchronously."""

        # Normalize to ResourceAvailability — accepts dict, object, None.
        resource_availability = _normalize_resource_availability(resource_availability)

        task = asyncio.current_task()
        if task:
            self._running_pipelines[execution_id] = task

        try:
            logger.info(f"Starting pipeline execution: {pipeline.name} (ID: {execution_id})")

            await self._emit_event(ExecutionEvent.PIPELINE_STARTED, {
                "pipeline_id": pipeline.id,
                "execution_id": execution_id,
                "pipeline_name": pipeline.name,
            })

            await self.state_manager.save_state(execution_id, pipeline)

            completed_nodes: List[str] = []
            failed_nodes: List[str] = []
            running_nodes: List[str] = []
            node_results: Dict[str, Any] = {}

            total_nodes = len(pipeline.nodes)

            while len(completed_nodes) + len(failed_nodes) < total_nodes:
                context = SchedulingContext(
                    pipeline=pipeline,
                    completed_nodes=completed_nodes,
                    failed_nodes=failed_nodes,
                    running_nodes=running_nodes,
                    resource_availability=resource_availability,   # now a ResourceAvailability
                    node_results=node_results,
                )

                nodes_to_execute = self.scheduler.schedule_pipeline(pipeline, context)

                if not nodes_to_execute:
                    if running_nodes:
                        await asyncio.sleep(1)
                        continue
                    else:
                        break

                execution_tasks = []
                for node_id in nodes_to_execute:
                    node = pipeline.nodes[node_id]
                    exec_task = self._execute_node(node, execution_id, pipeline)
                    execution_tasks.append(exec_task)
                    running_nodes.append(node_id)

                results = await asyncio.gather(*execution_tasks, return_exceptions=True)

                for node_id, result in zip(nodes_to_execute, results):
                    node = pipeline.nodes[node_id]
                    node_job_id = (node.metadata or {}).get("job_id") or (
                        getattr(node.job, "job_id", None) if node.job is not None else None
                    )
                    node_job_id_str = str(node_job_id) if node_job_id else None

                    if isinstance(result, Exception):
                        failed_nodes.append(node_id)
                        node_results[node_id] = {"error": str(result)}
                        await self._emit_event(ExecutionEvent.NODE_FAILED, {
                            "pipeline_id": pipeline.id,
                            "execution_id": execution_id,
                            "node_id": node_id,
                            "job_id": node_job_id_str,             
                            "error": str(result),
                        })
                    else:
                        completed_nodes.append(node_id)
                        node_results[node_id] = result
                        await self._emit_event(ExecutionEvent.NODE_COMPLETED, {
                            "pipeline_id": pipeline.id,
                            "execution_id": execution_id,
                            "node_id": node_id,
                            "job_id": node_job_id_str,              
                            "result": result,
                        })
                    running_nodes.remove(node_id)

                await self.state_manager.save_state(execution_id, pipeline)

            final_status = (
                ExecutionStatus.COMPLETED if not failed_nodes else ExecutionStatus.FAILED
            )

            await self._emit_event(ExecutionEvent.PIPELINE_COMPLETED, {
                "pipeline_id": pipeline.id,
                "execution_id": execution_id,
                "status": final_status.value,
                "completed_nodes": completed_nodes,
                "failed_nodes": failed_nodes,
                "node_results": node_results,
            })

            return {
                "execution_id": execution_id,
                "status": final_status.value,
                "completed_nodes": completed_nodes,
                "failed_nodes": failed_nodes,
                "node_results": node_results,
                "total_nodes": total_nodes,
            }

        except asyncio.CancelledError:
            await self._emit_event(ExecutionEvent.PIPELINE_FAILED, {
                "pipeline_id": pipeline.id,
                "execution_id": execution_id,
                "error": "Pipeline execution cancelled",
            })
            raise

        except Exception as e:
            logger.exception(f"Pipeline execution failed: {e}")
            await self._emit_event(ExecutionEvent.PIPELINE_FAILED, {
                "pipeline_id": pipeline.id,
                "execution_id": execution_id,
                "error": str(e),
            })
            raise

        finally:
            if execution_id in self._running_pipelines:
                del self._running_pipelines[execution_id]

    # ------------------------------------------------------------------
    # Node execution (unchanged)
    # ------------------------------------------------------------------

    async def _execute_node(
        self,
        node: PipelineNode,
        execution_id: UUID,
        pipeline: Pipeline,
    ) -> Any:
        node.status = NodeStatus.RUNNING
        node.start_time = datetime.now(timezone.utc)

        job_id = (node.metadata or {}).get("job_id") or (
            getattr(node.job, "job_id", None) if node.job is not None else None
        )


        await self._emit_event(ExecutionEvent.NODE_STARTED, {
            "pipeline_id": pipeline.id,
            "execution_id": execution_id,
            "node_id": node.id,
            "job_id": str(job_id) if job_id else None,   
            "node_name": node.name,
            "node_type": node.type.value,
        })

        try:
            result = await self.retry_handler.execute_with_retry(
                func=self._run_node_task,
                args=(node, execution_id, pipeline),
                retry_config=node.config.retry_policy,
            )

            node.status = NodeStatus.COMPLETED
            node.end_time = datetime.now(timezone.utc)
            node.metadata["output"] = result
            node.metadata["execution_time"] = (
                node.end_time - node.start_time
            ).total_seconds()

            return result

        except Exception as e:
            node.status = NodeStatus.FAILED
            node.error = str(e)
            node.end_time = datetime.now(timezone.utc)
            raise

    async def _run_node_task(
        self,
        node: PipelineNode,
        execution_id: UUID,
        pipeline: Pipeline,
    ) -> Any:
        node_type = node.type.value

        if node_type not in self._node_handlers:
            raise ValueError(f"No handler registered for node type: {node_type}")

        handler = self._node_handlers[node_type]

        if node.job is not None:
            job = node.job
            job.execution_id = execution_id
            job.pipeline_id = pipeline.id
            job.node_id = node.id
            job.metadata.setdefault("node_config", node.config.parameters)
            job.metadata.setdefault("pipeline_id", str(pipeline.id))
            job.metadata.setdefault("execution_id", str(execution_id))
            job.metadata.setdefault("node_type", node_type)
            job.metadata.setdefault("node_name", node.name)
            if inspect.iscoroutinefunction(handler):
                return await handler(job)
            return handler(job)

        class JobProxy:
            def __init__(self, node, execution_id, pipeline):
                self.job_id = execution_id
                self.execution_id = execution_id
                self.pipeline_id = pipeline.id
                self.node_id = node.id
                self.status = NodeStatus.PENDING
                self.progress = 0
                self.config = node.config.parameters
                self.result = None
                self.error = None
                self.metadata = {
                    "node_config": node.config.parameters,
                    "node_id": node.id,
                    "pipeline_id": pipeline.id,
                    "execution_id": execution_id,
                    "node_type": node_type,
                    "node_name": node.name,
                }

            def update_progress(self, progress: float):
                self.progress = progress

            def mark_started(self):
                self.status = NodeStatus.RUNNING

            def mark_completed(self, result):
                self.status = NodeStatus.COMPLETED
                self.result = result
                self.progress = 100

            def mark_failed(self, error):
                self.status = NodeStatus.FAILED
                self.error = error

        job = JobProxy(node, execution_id, pipeline)

        if inspect.iscoroutinefunction(handler):
            return await handler(job)
        return handler(job)

    async def _get_event_type(
        self, job_type: str, action: str = "complete", failed: bool = False
    ) -> ExecutionEvent:
        action_map = {
            "start": {k: ExecutionEvent.NODE_STARTED for k in (
                "data_collection", "preprocessing", "tokenization",
                "finetuning", "optimization", "deployment", "pipeline",
            )},
            "complete": {k: ExecutionEvent.NODE_COMPLETED for k in (
                "data_collection", "preprocessing", "tokenization",
                "finetuning", "optimization", "deployment", "pipeline",
            )},
            "fail": {k: ExecutionEvent.NODE_FAILED for k in (
                "data_collection", "preprocessing", "tokenization",
                "finetuning", "optimization", "deployment", "pipeline",
            )},
        }
        if failed:
            return action_map["fail"].get(job_type, ExecutionEvent.NODE_FAILED)
        return action_map.get(action, {}).get(job_type, ExecutionEvent.NODE_STARTED)

    def cancel_pipeline(self, execution_id: UUID) -> bool:
        if execution_id in self._running_pipelines:
            task = self._running_pipelines[execution_id]
            if not task.done():
                task.cancel()
                logger.info(f"Cancelled pipeline execution: {execution_id}")
                return True
        return False