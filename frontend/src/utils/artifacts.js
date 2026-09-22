import { STAGE_DEFINITIONS } from '../constants/pipelineStages';

/* -------------------------- Reference string -------------------------- */

export const serializeArtifact = ({ stageId, outputName }) =>
  `@stage:${stageId}:${outputName}`;

export const parseArtifact = (value) => {
  if (typeof value !== 'string') return null;
  const m = /^@stage:([^:]+):(.+)$/.exec(value);
  return m ? { stageId: m[1], outputName: m[2] } : null;
};

export const isArtifactRef = (value) => parseArtifact(value) !== null;

/* ---------------------- Sanitise user-provided names ----------------- */

/**
 * Names become part of a `@stage:<id>:<name>` reference, so keep them to
 * characters that are safe inside an opaque string. Anything else becomes
 * `_`. Empty input falls through to the caller for validation.
 */
export const sanitizeOutputName = (raw) =>
  String(raw ?? '')
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/^_+|_+$/g, '');

/* ------------------- Available artifacts from a pipeline --------------- */

const defFor = (type) => STAGE_DEFINITIONS.find((d) => d.id === type);

/**
 * Every artifact produced by every stage in `pipeline`.
 * Shape: [{
 *   stageId, stageName, stageType,
 *   kind,               // 'raw_data', 'model', …
 *   outputName,         // user-provided name (or kind as fallback)
 *   backendKey,         // the job result field the backend stores it under
 *   outputLabel,        // same as outputName — for UI display
 *   value,              // '@stage:<id>:<outputName>'
 * }]
 */
export const getAvailableArtifacts = (pipeline = []) => {
  const list = [];
  pipeline.forEach((stage) => {
    const def = defFor(stage.type);
    if (!def?.produces) return;

    const userNames = stage.config?.__output_names || {};

    def.produces.forEach((prod) => {
      const outputName = userNames[prod.kind] || prod.kind;

      list.push({
        stageId: stage.id,
        stageName: stage.name,
        stageType: stage.type,
        kind: prod.kind,
        outputName,
        backendKey: prod.key,
        outputLabel: outputName,
        value: serializeArtifact({
          stageId: stage.id,
          outputName,
        }),
      });
    });
  });
  return list;
};

export const getArtifactKinds = (pipeline = []) =>
  new Set(getAvailableArtifacts(pipeline).map((a) => a.kind));

/** Human label for a stored reference. */
export const describeArtifact = (value, pipeline = []) => {
  const ref = parseArtifact(value);
  if (!ref) return value;
  const match = getAvailableArtifacts(pipeline).find(
    (a) => a.stageId === ref.stageId && a.outputName === ref.outputName
  );
  return match ? `${match.stageName} → ${match.outputName}` : value;
};