import json
from typing import Dict, Any, Optional
from uuid import UUID
from datetime import datetime, timezone
from abc import ABC, abstractmethod
import logging
from redis.asyncio import Redis as AsyncRedis
from backend.core.pipeline_engine.models import NodeStatus, Pipeline

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# JSON-safe helpers
# ---------------------------------------------------------------------------

def _json_safe(value, _depth: int = 0):
    """
    Recursively coerce any value to something json.dumps can handle.

    Handles UUIDs, datetimes, Pydantic models, and anything else by
    falling back to str(). This is the safety net that catches FieldInfo
    objects and any other runtime type that sneaks into state.
    """
    if _depth > 20:                     # paranoia against cycles
        return str(value)
    if value is None or isinstance(value, (str, int, float, bool)):
        return value
    if isinstance(value, UUID):
        return str(value)
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, dict):
        return {str(k): _json_safe(v, _depth + 1) for k, v in value.items()}
    if isinstance(value, (list, tuple, set)):
        return [_json_safe(v, _depth + 1) for v in value]
    if hasattr(value, "model_dump"):
        try:
            return _json_safe(value.model_dump(mode="json"), _depth + 1)
        except Exception:
            return str(value)
    return str(value)


def _node_to_state(node) -> Dict[str, Any]:
    """
    Serialize a PipelineNode for state storage.

    Excludes the `job` field — it holds a runtime reference, not state, and
    may contain non-serializable values (e.g. FieldInfo from config bugs).
    """
    return {
        "id": node.id,
        "name": node.name,
        "type": node.type.value if hasattr(node.type, "value") else str(node.type),
        "status": node.status.value if hasattr(node.status, "value") else str(node.status),
        "config": {
            "parameters": _json_safe(node.config.parameters),
            "resources": _json_safe(node.config.resources),
            "retry_policy": _json_safe(node.config.retry_policy),
        },
        "metadata": _json_safe(node.metadata),
        "error": node.error,
        "start_time": node.start_time.isoformat() if node.start_time else None,
        "end_time": node.end_time.isoformat() if node.end_time else None,
    }


class StateStorage(ABC):
    """Strategy pattern for state storage backends"""

    @abstractmethod
    async def save(self, key: str, state: Dict[str, Any]) -> None: ...

    @abstractmethod
    async def load(self, key: str) -> Optional[Dict[str, Any] | Any]: ...

    @abstractmethod
    async def delete(self, key: str) -> None: ...

    @abstractmethod
    async def exists(self, key: str) -> bool: ...

    @abstractmethod
    async def list_keys(self, pattern: str) -> list: ...


class RedisStateStorage(StateStorage):
    """Redis-based state storage with async support"""

    def __init__(self, host: str = "localhost", port: int = 6379, db: int = 0,
                 password: Optional[str] = None, ttl: int = 3600):
        self.redis = AsyncRedis(
            host=host, port=port, db=db, password=password, decode_responses=True,
        )
        self.prefix = "pipeline:state:"
        self.checkpoint_prefix = "pipeline:checkpoint:"
        self.ttl = ttl
        self._connected = False

    async def _ensure_connection(self):
        if not self._connected:
            try:
                await self.redis.ping()
                self._connected = True
                logger.info("Redis connection established")
            except Exception as e:
                logger.error(f"Failed to connect to Redis: {e}")
                raise

    async def save(self, key: str, state: Dict[str, Any]) -> None:
        try:
            await self._ensure_connection()
            full_key = f"{self.prefix}{key}"
            # _json_safe is applied again as a final pass — belt and braces.
            await self.redis.setex(
                full_key, self.ttl,
                json.dumps(_json_safe(state), default=str),
            )
            logger.debug(f"State saved for key: {key}")
        except Exception as e:
            logger.error(f"Failed to save state for key {key}: {e}")
            raise

    async def load(self, key: str) -> Optional[Dict[str, Any]]:
        try:
            await self._ensure_connection()
            data = await self.redis.get(f"{self.prefix}{key}")
            if data:
                return json.loads(data)
            return None
        except Exception as e:
            logger.error(f"Failed to load state for key {key}: {e}")
            return None

    async def delete(self, key: str) -> None:
        try:
            await self._ensure_connection()
            await self.redis.delete(f"{self.prefix}{key}")
        except Exception as e:
            logger.error(f"Failed to delete state for key {key}: {e}")
            raise

    async def exists(self, key: str) -> bool:
        try:
            await self._ensure_connection()
            return (await self.redis.exists(f"{self.prefix}{key}")) > 0
        except Exception as e:
            logger.error(f"Failed to check existence for key {key}: {e}")
            return False

    async def list_keys(self, pattern: str = "*") -> list:
        try:
            await self._ensure_connection()
            keys = await self.redis.keys(f"{self.prefix}{pattern}")
            return [k.replace(self.prefix, "") for k in keys]
        except Exception as e:
            logger.error(f"Failed to list keys with pattern {pattern}: {e}")
            return []

    async def close(self):
        try:
            if self._connected:
                await self.redis.close()
                self._connected = False
        except Exception as e:
            logger.error(f"Error closing Redis connection: {e}")


class PipelineStateManager:
    """Manages pipeline state persistence and checkpointing"""

    def __init__(self, storage: StateStorage):
        self.storage = storage

    # ------------------------------------------------------------------
    # Save / load
    # ------------------------------------------------------------------

    async def save_state(self, execution_id: UUID, pipeline: Pipeline) -> None:
        """
        Persist the pipeline state.

        Uses `_node_to_state` for nodes so the runtime `job` reference is
        never serialized.
        """
        try:
            state = {
                "execution_id": str(execution_id),
                "pipeline_id": str(pipeline.id),
                "pipeline_name": pipeline.name,
                "nodes": {
                    node_id: _node_to_state(node)
                    for node_id, node in pipeline.nodes.items()
                },
                "edges": [
                    {
                        "source": e.source,
                        "target": e.target,
                        "condition": e.condition,
                    }
                    for e in pipeline.edges
                ],
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "version": pipeline.version,
                "tags": pipeline.tags,
            }

            await self.storage.save(str(execution_id), state)
            logger.debug(f"State saved for execution {execution_id}")

        except Exception as e:
            logger.error(f"Failed to save state for execution {execution_id}: {e}")
            raise

    async def load_state(self, execution_id: UUID) -> Optional[Pipeline]:
        try:
            state = await self.storage.load(str(execution_id))
            if not state:
                return None

            from backend.core.pipeline_engine.models import (
                Pipeline, PipelineNode, PipelineEdge, NodeType, NodeConfig,
            )

            pipeline = Pipeline(
                id=UUID(state["pipeline_id"]),
                name=state["pipeline_name"],
                version=state.get("version", 1),
                tags=state.get("tags", []),
            )

            for node_id, node_data in state.get("nodes", {}).items():
                cfg = node_data.get("config") or {}
                node = PipelineNode(
                    id=node_id,
                    name=node_data["name"],
                    type=NodeType(node_data["type"]),
                    config=NodeConfig(
                        parameters=cfg.get("parameters", {}),
                        resources=cfg.get("resources", {}),
                        retry_policy=cfg.get("retry_policy", {}),
                    ),
                    status=NodeStatus(node_data.get("status", "pending")),
                    metadata=node_data.get("metadata", {}),
                )
                pipeline.add_node(node)

            for edge_data in state.get("edges", []):
                pipeline.add_edge(PipelineEdge(
                    source=edge_data["source"],
                    target=edge_data["target"],
                    condition=edge_data.get("condition"),
                ))

            return pipeline

        except Exception as e:
            logger.error(f"Failed to load state for execution {execution_id}: {e}")
            return None

    # ------------------------------------------------------------------
    # Checkpoints
    # ------------------------------------------------------------------

    async def create_checkpoint(self, execution_id: UUID, pipeline: Pipeline) -> str:
        try:
            checkpoint_id = f"{execution_id}:{datetime.now(timezone.utc).timestamp()}"
            serialized = await self._serialize_pipeline(pipeline)
            await self.storage.save(checkpoint_id, {
                "execution_id": str(execution_id),
                "pipeline": serialized,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "checkpoint_type": "auto",
            })
            return checkpoint_id
        except Exception as e:
            logger.error(f"Failed to create checkpoint for execution {execution_id}: {e}")
            raise

    async def load_checkpoint(self, checkpoint_id: str) -> Optional[Pipeline]:
        try:
            data = await self.storage.load(checkpoint_id)
            if not data:
                return None
            return await self._deserialize_pipeline(data["pipeline"])
        except Exception as e:
            logger.error(f"Failed to load checkpoint {checkpoint_id}: {e}")
            return None

    async def cleanup_checkpoints(self, execution_id: UUID) -> int:
        try:
            keys = await self.storage.list_keys(f"{execution_id}:*")
            for key in keys:
                await self.storage.delete(key)
            return len(keys)
        except Exception as e:
            logger.error(f"Failed to cleanup checkpoints for execution {execution_id}: {e}")
            return 0

    async def get_latest_checkpoint(self, execution_id: UUID) -> Optional[str]:
        try:
            keys = await self.storage.list_keys(f"{execution_id}:*")
            if not keys:
                return None
            keys.sort(key=lambda k: float(k.split(":")[1]), reverse=True)
            return keys[0]
        except Exception as e:
            logger.error(f"Failed to get latest checkpoint for execution {execution_id}: {e}")
            return None

    # ------------------------------------------------------------------
    # Serialization
    # ------------------------------------------------------------------

    async def _serialize_pipeline(self, pipeline: Pipeline) -> str:
        """
        Serialize to JSON. Uses `_node_to_state` so the job reference is
        never included, and `_json_safe` as a final safety net.
        """
        pipeline_dict = {
            "id": str(pipeline.id),
            "name": pipeline.name,
            "description": pipeline.description,
            "version": pipeline.version,
            "nodes": {
                node_id: _node_to_state(node)
                for node_id, node in pipeline.nodes.items()
            },
            "edges": [
                {"source": e.source, "target": e.target, "condition": e.condition}
                for e in pipeline.edges
            ],
            "tags": pipeline.tags,
        }
        return json.dumps(_json_safe(pipeline_dict), default=str)

    async def _deserialize_pipeline(self, serialized: str) -> Pipeline:
        from backend.core.pipeline_engine.models import (
            Pipeline, PipelineNode, PipelineEdge, NodeType, NodeConfig,
        )

        d = json.loads(serialized)
        pipeline = Pipeline(
            id=UUID(d["id"]),
            name=d["name"],
            description=d.get("description"),
            version=d.get("version", 1),
            tags=d.get("tags", []),
        )

        for node_id, node_data in d.get("nodes", {}).items():
            cfg = node_data.get("config") or {}
            pipeline.add_node(PipelineNode(
                id=node_id,
                name=node_data["name"],
                type=NodeType(node_data["type"]),
                config=NodeConfig(
                    parameters=cfg.get("parameters", {}),
                    resources=cfg.get("resources", {}),
                    retry_policy=cfg.get("retry_policy", {}),
                ),
                status=NodeStatus(node_data.get("status", "pending")),
                metadata=node_data.get("metadata", {}),
            ))

        for edge_data in d.get("edges", []):
            pipeline.add_edge(PipelineEdge(
                source=edge_data["source"],
                target=edge_data["target"],
                condition=edge_data.get("condition"),
            ))

        return pipeline

    # ------------------------------------------------------------------
    # Logs
    # ------------------------------------------------------------------

    async def get_logs(self, execution_id: UUID, node_id: str = "*") -> Optional[list]:
        try:
            logs = await self.storage.load(f"logs:{execution_id}")
            if isinstance(logs, list):
                return logs
        except Exception as e:
            logger.error(f"Failed to get logs for execution {execution_id}: {e}")
        return None

    async def append_log(self, execution_id: UUID, log_entry: str) -> None:
        try:
            key = f"logs:{execution_id}"
            raw = await self.storage.load(key)

            # The storage backend may return a list, None, or a dict
            # (e.g. if the key is empty). Normalize to a list.
            logs = raw if isinstance(raw, list) else []

            logs.append(f"{datetime.now(timezone.utc).isoformat()} - {log_entry}")
            await self.storage.save(key, logs)
        except Exception as e:
            logger.error(f"Failed to append log for execution {execution_id}: {e}")