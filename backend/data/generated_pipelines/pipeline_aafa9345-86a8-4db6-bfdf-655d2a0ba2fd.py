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
  "id": "25dd3362-41e4-4a1d-ac28-57e1795f44c5",
  "name": "data_collection-e3c4e5ec-7744-4bca-b3a5-f781496a0eb3",
  "description": "Single-job pipeline for e3c4e5ec-7744-4bca-b3a5-f781496a0eb3",
  "version": 1,
  "created_at": "2026-09-22T15:03:47.944397",
  "updated_at": "2026-09-22T09:33:47.944943",
  "tags": [
    "data_ingestion",
    "optimized",
    "simple"
  ],
  "nodes": [
    {
      "id": "node_821ba942",
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
    "node_821ba942"
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
    "node_821ba942"
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
