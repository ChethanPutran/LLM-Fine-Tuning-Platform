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
  "id": "947ec2b7-fcc2-42da-8453-5789f7a041df",
  "name": "data_processing-664a3889-345d-400b-aef9-8ac040a9088b",
  "description": "Single-job pipeline for 664a3889-345d-400b-aef9-8ac040a9088b",
  "version": 1,
  "created_at": "2026-09-22T15:08:15.674029",
  "updated_at": "2026-09-22T09:38:15.674224",
  "tags": [
    "data_processing",
    "optimized",
    "simple"
  ],
  "nodes": [
    {
      "id": "node_bc85fce4",
      "name": "Preprocessing job",
      "type": "data_processing",
      "config": {
        "parameters": {},
        "resources": {
          "cpu": 4,
          "memory": "8GB"
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
    "node_bc85fce4"
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
    "node_bc85fce4"
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
