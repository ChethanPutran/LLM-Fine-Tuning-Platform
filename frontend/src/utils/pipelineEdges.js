import { parseArtifact } from './artifacts';
import { STAGE_DEFINITIONS } from '../constants/pipelineStages';

/* ------------------------------------------------------------------ */
/* Dependencies                                                       */
/* ------------------------------------------------------------------ */

/**
 * For each stage in the pipeline, compute the set of upstream stage ids
 * it depends on — derived from the `@stage:<id>:<key>` references in its
 * config. A stage with no refs to other stages in the pipeline is a root.
 *
 * Returns: { [stageId]: Set<upstreamStageId> }
 */
export const getStageDependencies = (pipeline = []) => {
  const stageIds = new Set(pipeline.map((s) => s.id));
  const deps = {};

  pipeline.forEach((stage) => {
    const def = STAGE_DEFINITIONS.find((d) => d.id === stage.type);
    const upstream = new Set();

    if (def) {
      const allFields = [
        ...(def.fields || []),
        ...(def.advancedFields || []),
      ];
      allFields.forEach((f) => {
        if (f.type !== 'artifact') return;
        const ref = parseArtifact(stage.config?.[f.key]);
        if (!ref) return;
        if (stageIds.has(ref.stageId) && ref.stageId !== stage.id) {
          upstream.add(ref.stageId);
        }
      });
    }

    deps[stage.id] = upstream;
  });

  return deps;
};

/* ------------------------------------------------------------------ */
/* Edges                                                              */
/* ------------------------------------------------------------------ */

/**
 * One edge per (source, target) pair. Multiple field-level refs from the
 * same upstream stage collapse into a single visual edge.
 *
 * Shape: [{ id, source, target, label, data: { fields: [{fieldKey, fieldLabel}] } }]
 */
export const getPipelineEdges = (pipeline = []) => {
  const stageById = Object.fromEntries(pipeline.map((s) => [s.id, s]));
  const edges = [];

  pipeline.forEach((target) => {
    const def = STAGE_DEFINITIONS.find((d) => d.id === target.type);
    if (!def) return;
    const allFields = [...(def.fields || []), ...(def.advancedFields || [])];

    const bySource = new Map(); // upstreamId -> [{ fieldKey, fieldLabel }]

    allFields.forEach((f) => {
      if (f.type !== 'artifact') return;
      const ref = parseArtifact(target.config?.[f.key]);
      if (!ref) return;
      if (!stageById[ref.stageId]) return; // stale ref
      if (ref.stageId === target.id) return; // self-loop

      if (!bySource.has(ref.stageId)) bySource.set(ref.stageId, []);
      bySource.get(ref.stageId).push({
        fieldKey: f.key,
        fieldLabel: f.label,
      });
    });

    bySource.forEach((fields, sourceId) => {
      edges.push({
        id: `e-${sourceId}-${target.id}`,
        source: sourceId,
        target: target.id,
        label:
          fields.length === 1
            ? fields[0].fieldLabel
            : `${fields.length} inputs`,
        data: { fields },
      });
    });
  });

  return edges;
};

/* ------------------------------------------------------------------ */
/* Layout — longest-path level per node                               */
/* ------------------------------------------------------------------ */

export const getStageLevels = (pipeline = []) => {
  const deps = getStageDependencies(pipeline);
  const levels = {};
  const inProgress = new Set();

  const computeLevel = (id) => {
    if (levels[id] !== undefined) return levels[id];
    if (inProgress.has(id)) return 0; // cycle — bail
    inProgress.add(id);

    const upstream = [...(deps[id] || [])];
    const level =
      upstream.length === 0
        ? 0
        : Math.max(...upstream.map(computeLevel)) + 1;

    inProgress.delete(id);
    levels[id] = level;
    return level;
  };

  pipeline.forEach((s) => computeLevel(s.id));
  return levels;
};

/* ------------------------------------------------------------------ */
/* Cycle detection                                                    */
/* ------------------------------------------------------------------ */

/**
 * Returns the cycle as an array of stage ids if one exists, or null.
 * e.g. ['stage-a', 'stage-b', 'stage-a']
 */
export const findCycle = (pipeline = []) => {
  const deps = getStageDependencies(pipeline);
  const visiting = new Set();
  const visited = new Set();
  const stack = [];
  let found = null;

  const dfs = (id) => {
    if (found) return;
    if (visiting.has(id)) {
      // slice the current stack from where id first appears
      const idx = stack.indexOf(id);
      found = [...stack.slice(idx), id];
      return;
    }
    if (visited.has(id)) return;

    visiting.add(id);
    stack.push(id);

    for (const upstream of deps[id] || []) {
      dfs(upstream);
      if (found) return;
    }

    stack.pop();
    visiting.delete(id);
    visited.add(id);
  };

  for (const s of pipeline) {
    dfs(s.id);
    if (found) break;
  }

  return found;
};

export const hasCycle = (pipeline = []) => findCycle(pipeline) !== null;