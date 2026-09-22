import { STAGE_DEFINITIONS } from '../constants/pipelineStages';
import { JOB_CREATORS } from './jobCreators';

/**
 * Re-register every stage's job with the backend.
 *
 * Imported / historically-saved pipelines carry jobIds from a previous
 * backend session. Those jobs no longer exist. We can't fix that by
 * "keeping" the id — we have to create a new job and store the new id.
 *
 * Preserves each stage's `id` so that `@stage:<id>:<name>` refs remain
 * valid. On failure, marks the stage as `failed` with an error message
 * instead of throwing, so partial rehydration still produces a usable
 * pipeline that the user can fix one stage at a time.
 *
 * Returns the same array shape as input, with fresh `jobId` and updated
 * `status` / `error` per stage.
 */
export const rehydrateJobs = async (pipeline) => {
  const results = await Promise.all(
    pipeline.map(async (stage) => {
      const def = STAGE_DEFINITIONS.find((d) => d.id === stage.type);
      const creator = JOB_CREATORS[stage.type];

      if (!def) {
        return {
          ...stage,
          jobId: null,
          status: 'failed',
          error: `Unknown stage type "${stage.type}"`,
        };
      }
      if (!creator) {
        return {
          ...stage,
          jobId: null,
          status: 'failed',
          error: `No job creator registered for "${stage.type}"`,
        };
      }

      try {
        const jobResult = await creator(stage.config || {});
        const newJobId = jobResult?.job_id;

        if (!newJobId) {
          return {
            ...stage,
            jobId: null,
            status: 'failed',
            error: 'Backend did not return a job_id',
          };
        }

        return {
          ...stage,
          jobId: newJobId,
          // Reset run-time state — the old job is gone, the new one
          // hasn't been executed yet.
          status: 'pending',
          progress: 0,
          result: null,
          error: null,
        };
      } catch (err) {
        console.error(`Rehydrate failed for stage ${stage.name}:`, err);
        return {
          ...stage,
          jobId: null,
          status: 'failed',
          error: err.message || 'Failed to re-register job',
        };
      }
    })
  );

  return results;
};