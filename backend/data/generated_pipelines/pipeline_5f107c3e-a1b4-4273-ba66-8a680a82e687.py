            """
            Auto-generated pipeline execution script.

            This script reconstructs the optimized pipeline graph and executes it
            using the backend pipeline engine.
            """

            import asyncio

            from app.common.job_models import JobPriority
            from app.core.pipeline_engine.models import Pipeline
            from app.core.pipeline_engine.orchestrator import PipelineOrchestrator


            PIPELINE = {
  "id": "fa46b7cf-2481-4d9e-9a95-5df21e1482c2",
  "name": "deployment-3544be01-a78b-4ce0-9706-e2e6eb7c3b55",
  "description": "Single-job pipeline for 3544be01-a78b-4ce0-9706-e2e6eb7c3b55",
  "version": 1,
  "created_at": "2026-09-22T15:26:21.793050",
  "updated_at": "2026-09-22T09:56:21.793216",
  "tags": [
    "model_deployment",
    "optimized",
    "simple"
  ],
  "nodes": [
    {
      "id": "node_3c8fe50c",
      "name": "Deployment model",
      "type": "model_deployment",
      "config": {
        "parameters": {},
        "resources": {
          "cpu": 2,
          "memory": "4GB"
        },
        "retry_policy": {
          "retries": 3,
          "delay_seconds": 5
        }
      },
      "status": "pending",
      "metadata": {
        "optimization": {
          "execution_level": 0,
          "can_run_in_parallel_with": []
        }
      }
    }
  ],
  "edges": []
}

            EXECUTION_PLAN = [
  [
    "node_3c8fe50c"
  ]
]

            OPTIMIZATION_SUMMARY = {
  "original_nodes": 1,
  "optimized_nodes": 1,
  "original_edges": 0,
  "optimized_edges": 0,
  "duplicate_edges_removed": 0,
  "transitive_edges_removed": 0,
  "parallel_stages": 1,
  "execution_order": [
    "node_3c8fe50c"
  ]
}


            async def main():
                orchestrator = PipelineOrchestrator()
                await orchestrator.start()
                try:
                    pipeline = Pipeline.from_dict(PIPELINE)
                    result = await orchestrator._execute_pipeline(
                        pipeline=pipeline,
                        user_id=None,
                        priority=JobPriority.LOW,
                    )
                    print(result)
                    return result
                finally:
                    await orchestrator.stop()


            if __name__ == "__main__":
                asyncio.run(main())
