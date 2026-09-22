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
  "id": "89477576-ae9f-4043-8fa4-4aa32a6f507e",
  "name": "deployment-2466adc9-5e82-43d3-a090-ef911e26275d",
  "description": "Single-job pipeline for 2466adc9-5e82-43d3-a090-ef911e26275d",
  "version": 1,
  "created_at": "2026-09-22T15:27:32.181253",
  "updated_at": "2026-09-22T09:57:32.181427",
  "tags": [
    "model_deployment",
    "optimized",
    "simple"
  ],
  "nodes": [
    {
      "id": "node_104e8fa3",
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
    "node_104e8fa3"
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
    "node_104e8fa3"
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
