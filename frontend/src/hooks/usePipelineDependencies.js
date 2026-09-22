import { useMemo, useCallback } from 'react';
import {
  getAvailableKinds,
  getAvailableArtifacts,
  canAddStage,
  describeMissing,
  findInvalidStages,
  findBrokenArtifactRefs,
} from '../utils/pipelineDependencies';

export const usePipelineDependencies = (pipeline) => {
  // Set<string> of kinds — what stages are gated on
  const available = useMemo(() => getAvailableKinds(pipeline), [pipeline]);

  // Array of concrete artifacts — what the dropdown needs
  const availableArtifacts = useMemo(
    () => getAvailableArtifacts(pipeline),
    [pipeline]
  );

  const canAdd = useCallback(
    (stageType) => canAddStage(stageType, pipeline),
    [pipeline]
  );

  const invalidStages = useMemo(
    () => findInvalidStages(pipeline),
    [pipeline]
  );

  const brokenRefs = useMemo(
    () => findBrokenArtifactRefs(pipeline),
    [pipeline]
  );

  return {
    available,           // Set<kind>
    availableArtifacts,  // Array<instance>
    canAdd,
    describeMissing,
    invalidStages,
    brokenRefs,
  };
};