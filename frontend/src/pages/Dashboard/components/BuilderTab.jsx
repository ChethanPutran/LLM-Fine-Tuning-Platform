import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  Grid, Box, Typography, Chip, FormControlLabel, Switch,
  Dialog, DialogTitle, DialogContent, DialogActions,
  DialogContentText, Button, Alert, List, ListItem, ListItemText,
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';

import PipelineVisualizer from './PipelineVisualizer';
import { StageBuilderPanel } from './StageBuilderPanel';
import { PipelineControls } from './PipelineControls';
import { PipelineSummary } from './PipelineSummary';
import { SelectedStageCard } from './SelectedStageCard';
import { rehydrateJobs } from '../../../utils/rehydrateJobs';

import {
  findBrokenArtifactRefs,
  findInvalidStages,
  describeMissing,
} from '../../../utils/pipelineDependencies';
import { findCycle, getStageLevels } from '../../../utils/pipelineEdges';
import {
  canRunStage as canRunStageUtil,
  getUpstreamStageIds,
} from '../../../utils/stageRunHelpers';

/* ------------------------------------------------------------------ */
/* Cascade helpers                                                    */
/* ------------------------------------------------------------------ */

/**
 * Set of stage ids that are downstream of `startStageId`
 * (transitively), including `startStageId` itself.
 */
const getDownstreamClosure = (startStageId, pipeline) => {
  const closure = new Set([startStageId]);
  let changed = true;
  while (changed) {
    changed = false;
    pipeline.forEach((s) => {
      if (closure.has(s.id)) return;
      const upstream = getUpstreamStageIds(s.id, pipeline);
      if (upstream.some((u) => closure.has(u))) {
        closure.add(s.id);
        changed = true;
      }
    });
  }
  return closure;
};

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */

export const BuilderTab = ({
  pipeline,
  setPipeline,
  onRun,
  onSave,
  isRunning,
  autoRefresh,
  setAutoRefresh,
  notify,
  runStage,             // ← from Dashboard: execution.runStage
}) => {
  const [selectedStage, setSelectedStage] = useState(null);
  const [pendingRemoval, setPendingRemoval] = useState(null);

  /* ---------------- Cascade queue state ---------------- */

  const [runQueue, setRunQueue] = useState([]);   // stage ids in order
  const dispatchedRef = useRef(new Set());        // survives StrictMode double-effect

  const cascadeActive = runQueue.length > 0;

  /* ---------------- Derived analysis ---------------- */

  const brokenRefs = useMemo(
    () => findBrokenArtifactRefs(pipeline),
    [pipeline]
  );

  const invalidStages = useMemo(
    () => findInvalidStages(pipeline),
    [pipeline]
  );

  const cycle = useMemo(() => findCycle(pipeline), [pipeline]);

  const brokenStageIds = useMemo(
    () => new Set(brokenRefs.map(({ stage }) => stage.id)),
    [brokenRefs]
  );

  const cycleStageIds = useMemo(() => new Set(cycle || []), [cycle]);

  /* --------------------------- Add --------------------------- */

  const handleAdd = useCallback(
    (node) => setPipeline((prev) => [...prev, node]),
    [setPipeline]
  );

  /* --------------------------- Remove ------------------------ */

  const performRemove = useCallback(
    (id) => {
      setPipeline((prev) => prev.filter((n) => n.id !== id));
      setSelectedStage((prev) => (prev?.id === id ? null : prev));
      notify('Stage removed from pipeline', 'info');
    },
    [setPipeline, notify]
  );

  const handleRemove = useCallback(
    (id) => {
      const next = pipeline.filter((n) => n.id !== id);
      const nextInvalid = findInvalidStages(next);
      const nextBroken = findBrokenArtifactRefs(next);

      if (nextInvalid.length === 0 && nextBroken.length === 0) {
        performRemove(id);
        return;
      }

      const removedStage = pipeline.find((n) => n.id === id);
      setPendingRemoval({
        id,
        stageName: removedStage?.name ?? 'this stage',
        invalidStages: nextInvalid,
        brokenRefs: nextBroken,
      });
    },
    [pipeline, performRemove]
  );

  const confirmRemove = useCallback(() => {
    if (!pendingRemoval) return;
    performRemove(pendingRemoval.id);
    setPendingRemoval(null);
  }, [pendingRemoval, performRemove]);

  const cancelRemove = useCallback(() => setPendingRemoval(null), []);

  /* ------------------------ Clear / Export / Import --------- */

  const handleClearAll = useCallback(() => {
    if (!pipeline.length) return;
    if (!window.confirm('Clear the entire pipeline? This cannot be undone.')) return;
    setPipeline([]);
    setSelectedStage(null);
    setRunQueue([]);
    notify('Pipeline cleared', 'info');
  }, [pipeline, setPipeline, notify]);

  const handleExport = useCallback(() => {
    const dataStr = JSON.stringify(
      {
        pipeline,
        metadata: {
          version: '1.0',
          exportedAt: new Date().toISOString(),
          stageCount: pipeline.length,
          jobIds: pipeline.map((s) => s.jobId).filter(Boolean),
        },
      },
      null,
      2
    );
    const uri =
      'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const a = document.createElement('a');
    a.setAttribute('href', uri);
    a.setAttribute('download', `pipeline_${Date.now()}.json`);
    a.click();
    notify('Pipeline exported successfully', 'success');
  }, [pipeline, notify]);

  const handleImport = useCallback(() => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';

  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = async (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        const importedPipeline = parsed.pipeline || parsed;

        if (!Array.isArray(importedPipeline)) {
          throw new Error('Invalid pipeline format');
        }

        /* ---- 1. Structural checks first — don't waste API calls on a
                    pipeline we're going to reject anyway. ---- */
        const cyc = findCycle(importedPipeline);
        if (cyc) {
          notify(
            'Cannot import: pipeline has a circular dependency.',
            'error'
          );
          return;
        }

        const invalid = findInvalidStages(importedPipeline);
        const broken = findBrokenArtifactRefs(importedPipeline);

        /* ---- 2. Re-register jobs with the backend. Imported jobIds are
                    stale — refer to a previous backend session. ---- */
        notify(
          `Registering ${importedPipeline.length} job${
            importedPipeline.length > 1 ? 's' : ''
          } with the backend…`,
          'info'
        );

        const rehydrated = await rehydrateJobs(importedPipeline);

        /* ---- 3. Commit to state. ---- */
        setPipeline(rehydrated);
        setRunQueue([]);

        /* ---- 4. Report outcome. ---- */
        const failedJobs = rehydrated.filter(
          (s) => !s.jobId || s.status === 'failed'
        );
        const problems =
          invalid.length + broken.length + failedJobs.length;

        if (failedJobs.length > 0) {
          const names = failedJobs.map((s) => s.name).join(', ');
          notify(
            `Imported ${rehydrated.length} stages — failed to register: ${names}`,
            'warning'
          );
        } else if (problems > 0) {
          notify(
            `Imported ${rehydrated.length} stages — ${problems} issue${
              problems > 1 ? 's' : ''
            } found`,
            'warning'
          );
        } else {
          notify(
            `Imported ${rehydrated.length} stage${
              rehydrated.length > 1 ? 's' : ''
            } — ready to run`,
            'success'
          );
        }
      } catch (err) {
        console.error(err);
        notify(
          `Failed to import pipeline: ${err.message || 'invalid format'}`,
          'error'
        );
      }
    };

    reader.readAsText(file);
  };

  input.click();
}, [setPipeline, notify]);

  /* --------------------------- Misc -------------------------- */

  const handleNodeClick = useCallback(
    (node) => setSelectedStage(pipeline.find((n) => n.id === node.id)),
    [pipeline]
  );

  /* ------------------ Single-stage execution ----------------- */

  const canRunStageFn = useCallback(
    (stage) => canRunStageUtil(stage, pipeline),
    [pipeline]
  );

  /**
   * Dispatch a single stage. Returns Promise<boolean> where `true`
   * means the execution was successfully kicked off (not that it finished).
   */
  const handleRunStage = useCallback(
    async (stageId) => {
      const stage = pipeline.find((s) => s.id === stageId);
      if (!stage) return false;

      const gate = canRunStageUtil(stage, pipeline);
      if (!gate.ok) {
        notify(gate.reason, 'warning');
        return false;
      }
      if (!runStage) {
        notify('Stage execution is not wired up', 'error');
        return false;
      }

      const result = await runStage(stageId);
      if (result?.ok) {
        notify(`${stage.name} started`, 'success');
        return true;
      }
      notify(result?.reason || `${stage.name} failed to start`, 'error');
      return false;
    },
    [pipeline, runStage, notify]
  );

  /* ---------------- Run all downstream of X ------------------ */

  const handleRunDownstreamOf = useCallback(
    (startStageId) => {
      if (cascadeActive) {
        notify(
          `A cascade is already running (${runQueue.length} stage${
            runQueue.length > 1 ? 's' : ''
          } remaining)`,
          'warning'
        );
        return;
      }

      const closure = getDownstreamClosure(startStageId, pipeline);
      const levels = getStageLevels(pipeline);

      // Sort the closure by dependency level so upstream runs before downstream.
      const ordered = pipeline
        .filter((s) => closure.has(s.id))
        .sort((a, b) => (levels[a.id] ?? 0) - (levels[b.id] ?? 0));

      if (ordered.length === 0) {
        notify('Nothing to run', 'info');
        return;
      }

      // Guard against missing runStage before committing.
      if (!runStage) {
        notify('Stage execution is not wired up', 'error');
        return;
      }

      const startName =
        pipeline.find((s) => s.id === startStageId)?.name ?? startStageId;
      notify(
        `Cascade starting from ${startName}: ${ordered.length} stage${
          ordered.length > 1 ? 's' : ''
        } queued`,
        'info'
      );

      dispatchedRef.current.clear();
      setRunQueue(ordered.map((s) => s.id));
    },
    [pipeline, runQueue.length, cascadeActive, runStage, notify]
  );

  /* ---------------- Cascade drainer -------------------------- */

  useEffect(() => {
    if (runQueue.length === 0) {
      dispatchedRef.current.clear();
      return;
    }

    const nextId = runQueue[0];
    const stage = pipeline.find((s) => s.id === nextId);

    // Stage disappeared (removed mid-cascade) → drop it and continue.
    if (!stage) {
      setRunQueue((q) => q.slice(1));
      return;
    }

    // Already finished → advance.
    if (stage.status === 'completed') {
      setRunQueue((q) => q.slice(1));
      return;
    }

    // Still running → wait for the next WebSocket status update.
    if (stage.status === 'running') {
      return;
    }

    // Failed → abort the cascade; user must fix and restart.
    if (stage.status === 'failed') {
      notify(
        `Cascade aborted: ${stage.name} failed${
          stage.error ? ` — ${stage.error}` : ''
        }`,
        'error'
      );
      setRunQueue([]);
      return;
    }

    // Pending → dispatch, but only once per stage (StrictMode guard).
    if (dispatchedRef.current.has(nextId)) return;
    dispatchedRef.current.add(nextId);

    (async () => {
      const ok = await handleRunStage(nextId);
      if (!ok) {
        // Gate failed or API call rejected → abort the whole cascade.
        setRunQueue([]);
      }
      // On success: leave the stage at the front of the queue. The next
      // WebSocket `execution_update` will flip it to 'running' then
      // 'completed', and this effect will advance.
    })();
  }, [runQueue, pipeline, handleRunStage, notify]);

  /* --------------------------- Run gate ---------------------- */

  const hasUnregisteredJobs = pipeline.some((s) => !s.jobId);

const canRun =
  pipeline.length > 0 &&
  !isRunning &&
  brokenRefs.length === 0 &&
  !cycle &&
  !hasUnregisteredJobs;

  const handleRunGuarded = useCallback(() => {
  if (cascadeActive) {
    notify('A cascade is already running', 'warning');
    return;
  }
  if (cycle) {
    notify('Cannot run: pipeline has a circular dependency.', 'error');
    return;
  }
  if (brokenRefs.length > 0) {
    notify(
      `Cannot run: ${brokenRefs.length} field${
        brokenRefs.length > 1 ? 's' : ''
      } point to missing outputs.`,
      'error'
    );
    return;
  }
  if (hasUnregisteredJobs) {
    const names = pipeline
      .filter((s) => !s.jobId)
      .map((s) => s.name)
      .join(', ');
    notify(
      `Cannot run: these stages have no backend job: ${names}. Remove and re-add them.`,
      'error'
    );
    return;
  }
  onRun();
}, [cycle, brokenRefs, hasUnregisteredJobs, pipeline, onRun, notify, cascadeActive]);

  const pendingProblems = pendingRemoval
    ? pendingRemoval.invalidStages.length + pendingRemoval.brokenRefs.length
    : 0;

  /* --------------------------- Render ------------------------ */

  return (
    <>
      {/* Cascade progress banner */}
      {cascadeActive && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Cascade running — {runQueue.length} stage
          {runQueue.length > 1 ? 's' : ''} remaining in queue:{' '}
          {runQueue
            .map((id) => pipeline.find((s) => s.id === id)?.name ?? id)
            .join(' → ')}
        </Alert>
      )}

      {cycle && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <strong>Circular dependency detected:</strong>{' '}
          {cycle
            .map((id) => pipeline.find((s) => s.id === id)?.name ?? id)
            .join(' → ')}
          . Break the loop before running.
        </Alert>
      )}

      {brokenRefs.length > 0 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {brokenRefs.length} field
          {brokenRefs.length > 1 ? 's are' : ' is'} pointing at outputs
          that no longer exist:
          <ul style={{ margin: '4px 0 0 20px' }}>
            {brokenRefs.map(({ stage, fieldLabel }, i) => (
              <li key={i}>
                {stage.name} → {fieldLabel}
              </li>
            ))}
          </ul>
        </Alert>
      )}

      {!cycle && invalidStages.length > 0 && brokenRefs.length === 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {invalidStages.length} stage
          {invalidStages.length > 1 ? 's are' : ' is'} missing upstream
          prerequisites:
          <ul style={{ margin: '4px 0 0 20px' }}>
            {invalidStages.map(({ stage, missing }) => (
              <li key={stage.id}>
                {stage.name} — needs {describeMissing(missing)}
              </li>
            ))}
          </ul>
        </Alert>
      )}

      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <StageBuilderPanel
            pipeline={pipeline}
            onAdd={handleAdd}
            isRunning={isRunning || cascadeActive}
            notify={notify}
          />
          <PipelineControls
            onSave={onSave}
            onExport={handleExport}
            onImport={handleImport}
            onClear={handleClearAll}
            onRun={handleRunGuarded}
            disabled={pipeline.length === 0}
            isRunning={isRunning || cascadeActive}
            canRun={canRun}
            runBlockReason={
    hasUnregisteredJobs
      ? 'Some stages are not registered with the backend. Remove and re-add them.'
      : ''
  }
          />
        </Grid>

        <Grid item xs={12} md={8}>
          <Box
            sx={{
              mb: 2,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography variant="h6" color="text.secondary">
              Pipeline Visualization
              {pipeline.length > 0 && (
                <Chip
                  label={`${pipeline.length} stage${
                    pipeline.length !== 1 ? 's' : ''
                  }`}
                  size="small"
                  sx={{ ml: 1 }}
                />
              )}
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  size="small"
                />
              }
              label="Auto Refresh"
            />
          </Box>

          <PipelineVisualizer
            pipelineNodes={pipeline}
            onNodeClick={handleNodeClick}
            brokenStageIds={brokenStageIds}
            cycleStageIds={cycleStageIds}
          />

          <SelectedStageCard
            stage={selectedStage}
            onClose={() => setSelectedStage(null)}
            onRunStage={handleRunStage}
            onRunDownstreamOf={handleRunDownstreamOf}
            canRunStage={canRunStageFn}
            isRunningPipeline={isRunning}
            isCascadeActive={cascadeActive}
          />
        </Grid>

        <Grid item xs={12}>
          <PipelineSummary
            pipeline={pipeline}
            onRemove={handleRemove}
            onRunStage={handleRunStage}
            onRunDownstreamOf={handleRunDownstreamOf}
            canRunStage={canRunStageFn}
            isRunning={isRunning}
            isCascadeActive={cascadeActive}
          />
        </Grid>
      </Grid>

      {/* Removal confirmation dialog */}
      <Dialog
        open={!!pendingRemoval}
        onClose={cancelRemove}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="warning" />
          Removing this stage will break the pipeline
        </DialogTitle>

        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Removing <strong>{pendingRemoval?.stageName}</strong> will leave{' '}
            {pendingProblems === 1 ? 'this issue' : 'these issues'}:
          </DialogContentText>

          {pendingRemoval?.invalidStages.length > 0 && (
            <>
              <Typography variant="subtitle2" sx={{ mt: 1, mb: 0.5 }}>
                Missing prerequisites
              </Typography>
              <List dense sx={{ bgcolor: 'action.hover', borderRadius: 1 }}>
                {pendingRemoval.invalidStages.map(({ stage, missing }) => (
                  <ListItem key={stage.id}>
                    <ListItemText
                      primary={stage.name}
                      secondary={`needs ${describeMissing(missing)}`}
                      primaryTypographyProps={{ fontWeight: 600 }}
                    />
                  </ListItem>
                ))}
              </List>
            </>
          )}

          {pendingRemoval?.brokenRefs.length > 0 && (
            <>
              <Typography variant="subtitle2" sx={{ mt: 2, mb: 0.5 }}>
                Broken references
              </Typography>
              <List dense sx={{ bgcolor: 'action.hover', borderRadius: 1 }}>
                {pendingRemoval.brokenRefs.map(({ stage, fieldLabel }, i) => (
                  <ListItem key={`${stage.id}-${i}`}>
                    <ListItemText
                      primary={stage.name}
                      secondary={`"${fieldLabel}" points to a removed output`}
                      primaryTypographyProps={{ fontWeight: 600 }}
                    />
                  </ListItem>
                ))}
              </List>
            </>
          )}

          <Alert severity="info" sx={{ mt: 2 }}>
            You can continue, but you'll need to fix{' '}
            {pendingProblems === 1 ? 'this' : 'these'} before the pipeline will
            run successfully.
          </Alert>
        </DialogContent>

        <DialogActions>
          <Button onClick={cancelRemove}>Cancel</Button>
          <Button
            onClick={confirmRemove}
            color="warning"
            variant="contained"
            autoFocus
          >
            Remove anyway
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};