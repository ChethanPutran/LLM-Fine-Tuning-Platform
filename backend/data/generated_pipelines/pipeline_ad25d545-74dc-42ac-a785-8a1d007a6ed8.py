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
  "id": "0a73037f-b15e-4b06-9e3c-236f05318ff0",
  "name": "training-7a3a331b-b16f-41e4-99e0-d01d8524c017",
  "description": "Single-job pipeline for 7a3a331b-b16f-41e4-99e0-d01d8524c017",
  "version": 1,
  "created_at": "2026-09-22T15:18:21.823100",
  "updated_at": "2026-09-22T09:48:21.823283",
  "tags": [
    "model_training",
    "optimized",
    "simple"
  ],
  "nodes": [
    {
      "id": "node_c272f1bb",
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
    "node_c272f1bb"
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
    "node_c272f1bb"
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
