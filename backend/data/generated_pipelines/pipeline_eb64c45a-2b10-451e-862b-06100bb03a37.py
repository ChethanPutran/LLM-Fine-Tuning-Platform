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
  "id": "6f1e9c3b-6733-40b4-9e27-562eedce801e",
  "name": "deployment-30689e13-e118-41aa-be4b-e89ee43ce985",
  "description": "Single-job pipeline for 30689e13-e118-41aa-be4b-e89ee43ce985",
  "version": 1,
  "created_at": "2026-09-22T15:08:15.767862",
  "updated_at": "2026-09-22T09:38:15.768046",
  "tags": [
    "model_deployment",
    "optimized",
    "simple"
  ],
  "nodes": [
    {
      "id": "node_94baf68b",
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
    "node_94baf68b"
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
    "node_94baf68b"
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
