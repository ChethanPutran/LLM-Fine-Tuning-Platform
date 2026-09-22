import { parseArtifact } from './artifacts';
import { STAGE_DEFINITIONS } from '../constants/pipelineStages';

/**
 * Stage ids that `stageId` depends on via artifact refs.
 * Only refs pointing to stages actually present in the pipeline count.
 */
export const getUpstreamStageIds = (stageId, pipeline = []) => {
  const stage = pipeline.find((s) => s.id === stageId);
  if (!stage) return [];

  const def = STAGE_DEFINITIONS.find((d) => d.id === stage.type);
  if (!def) return [];

  const stageIds = new Set(pipeline.map((s) => s.id));
  const upstream = new Set();

  [...(def.fields || []), ...(def.advancedFields || [])].forEach((f) => {
    if (f.type !== 'artifact') return;
    const ref = parseArtifact(stage.config?.[f.key]);
    if (!ref) return;
    if (ref.stageId !== stageId && stageIds.has(ref.stageId)) {
      upstream.add(ref.stageId);
    }
  });

  return [...upstream];
};

/**
 * Upstream stages that are NOT yet `completed`.
 * Returns [{ id, name, status }]
 */
export const getMissingUpstream = (stageId, pipeline = []) => {
  return getUpstreamStageIds(stageId, pipeline)
    .map((id) => pipeline.find((s) => s.id === id))
    .filter((s) => s && s.status !== 'completed')
    .map((s) => ({ id: s.id, name: s.name, status: s.status || 'pending' }));
};

/**
 * Whether a stage can be run individually right now.
 * Returns { ok, reason }
 */
export const canRunStage = (stage, pipeline = []) => {
  if (!stage) return { ok: false, reason: 'Stage not found' };
  if (!stage.jobId)
    return { ok: false, reason: 'Stage has no job — remove and re-add it' };
  if (stage.status === 'running')
    return { ok: false, reason: 'Stage is already running' };

  const missing = getMissingUpstream(stage.id, pipeline);
  if (missing.length > 0) {
    const names = missing.map((m) => m.name).join(', ');
    return {
      ok: false,
      reason: `Run these upstream stages first: ${names}`,
      missing,
    };
  }

  return { ok: true };
};

/** Short label for a stage's status chip. */
export const describeStageStatus = (status) => {
  switch (status) {
    case 'completed': return 'Completed';
    case 'running':   return 'Running';
    case 'failed':    return 'Failed';
    case 'cancelled': return 'Cancelled';
    default:          return 'Pending';
  }
};