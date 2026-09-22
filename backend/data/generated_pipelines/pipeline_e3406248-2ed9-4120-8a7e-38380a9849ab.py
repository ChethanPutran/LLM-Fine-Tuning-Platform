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
  "id": "657359dd-5a65-479a-87ae-f810f6d5c1de",
  "name": "training-e2c6985f-d9d9-48ad-b017-8999b7cd1724",
  "description": "Single-job pipeline for e2c6985f-d9d9-48ad-b017-8999b7cd1724",
  "version": 1,
  "created_at": "2026-09-22T15:27:32.079515",
  "updated_at": "2026-09-22T09:57:32.079660",
  "tags": [
    "model_training",
    "optimized",
    "simple"
  ],
  "nodes": [
    {
      "id": "node_1ca7ced9",
      "name": "Train bert",
      "type": "model_training",
      "config": {
        "parameters": {},
        "resources": {
          "gpu": 1,
          "cpu": 8,
          "memory": "32GB"
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
    "node_1ca7ced9"
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
    "node_1ca7ced9"
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
                        priority=JobPriority.HIGH,
                    )
                    print(result)
                    return result
                finally:
                    await orchestrator.stop()


            if __name__ == "__main__":
                asyncio.run(main())
