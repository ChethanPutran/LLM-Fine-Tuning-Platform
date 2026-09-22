import { STAGE_IO, ARTIFACT_LABELS } from '../constants/pipelineDependencies';
import { STAGE_DEFINITIONS } from '../constants/pipelineStages';
import {
  parseArtifact,
  getAvailableArtifacts,
} from './artifacts';

/* ------------------------------------------------------------------ */
/* Re-export artifact helpers so consumers have one import point      */
/* ------------------------------------------------------------------ */

export {
  parseArtifact,
  serializeArtifact,
  isArtifactRef,
  getAvailableArtifacts,
  getArtifactKinds,
  describeArtifact,
} from './artifacts';

/* ------------------------------------------------------------------ */
/* Kind-level helpers (stage dependency graph)                        */
/* ------------------------------------------------------------------ */

/**
 * Set of artifact *kinds* produced by any stage in the pipeline.
 *   { 'raw_data', 'clean_data', 'model', ... }
 *
 * Distinct from `getAvailableArtifacts`, which returns concrete instances
 * (stageId + outputKey + …).
 */
export const getAvailableKinds = (pipeline = []) => {
  const kinds = new Set();
  pipeline.forEach((stage) => {
    const io = STAGE_IO[stage.type];
    if (!io) return;
    io.produces.forEach((k) => kinds.add(k));
  });
  return kinds;
};

/**
 * Artifact kinds required by `stageType` but not produced by any
 * stage in `pipeline`.
 */
export const getMissingRequirements = (stageType, pipeline = []) => {
  const io = STAGE_IO[stageType];
  if (!io) return [];
  const available = getAvailableKinds(pipeline);
  return io.requires.filter((req) => !available.has(req));
};

/** { ok: boolean, missing: string[] } */
export const canAddStage = (stageType, pipeline = []) => {
  const missing = getMissingRequirements(stageType, pipeline);
  return { ok: missing.length === 0, missing };
};

/** "raw data and a trained model" */
export const describeMissing = (missing = []) =>
  missing
    .map((a) => ARTIFACT_LABELS[a] || a)
    .join(' and ');

/* ------------------------------------------------------------------ */
/* Validation over an existing pipeline                               */
/* ------------------------------------------------------------------ */

/**
 * Stages whose required artifacts aren't produced *somewhere upstream*.
 * Walks the pipeline left-to-right, accumulating produced kinds.
 */
export const findInvalidStages = (pipeline = []) => {
  const available = new Set();
  const invalid = [];

  pipeline.forEach((stage) => {
    const io = STAGE_IO[stage.type];
    if (!io) return;

    const missing = io.requires.filter((r) => !available.has(r));
    if (missing.length) invalid.push({ stage, missing });

    io.produces.forEach((a) => available.add(a));
  });

  return invalid;
};

/**
 * Artifact-reference fields whose target stage or output no longer exists.
 * Returns [{ stage, fieldKey, fieldLabel, ref }]
 */
export const findBrokenArtifactRefs = (pipeline = []) => {
  const producedIds = new Set(
    getAvailableArtifacts(pipeline).map((a) => `${a.stageId}:${a.outputKey}`)
  );

  const broken = [];
  pipeline.forEach((stage) => {
    const def = STAGE_DEFINITIONS.find((d) => d.id === stage.type);
    if (!def) return;

    const allFields = [
      ...(def.fields || []),
      ...(def.advancedFields || []),
    ];

    allFields.forEach((f) => {
      if (f.type !== 'artifact') return;
      const ref = parseArtifact(stage.config?.[f.key]);
      if (!ref) return;
      if (!producedIds.has(`${ref.stageId}:${ref.outputKey}`)) {
        broken.push({
          stage,
          fieldKey: f.key,
          fieldLabel: f.label,
          ref,
        });
      }
    });
  });

  return broken;
};