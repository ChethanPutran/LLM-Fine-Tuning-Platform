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
  "id": "259e5002-cb40-48c2-b3e7-b04ba229f2d6",
  "name": "data_collection-e4f46b59-8c1b-4675-854e-706ed1442dad",
  "description": "Single-job pipeline for e4f46b59-8c1b-4675-854e-706ed1442dad",
  "version": 1,
  "created_at": "2026-09-22T15:35:31.550819",
  "updated_at": "2026-09-22T10:05:31.551318",
  "tags": [
    "data_ingestion",
    "optimized",
    "simple"
  ],
  "nodes": [
    {
      "id": "node_66473372",
      "name": "Data Collection",
      "type": "data_ingestion",
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
    "node_66473372"
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
    "node_66473372"
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
                        priority=JobPriority.CRITICAL,
                    )
                    print(result)
                    return result
                finally:
                    await orchestrator.stop()


            if __name__ == "__main__":
                asyncio.run(main())
