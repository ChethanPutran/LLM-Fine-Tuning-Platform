import { useState, useCallback } from 'react';
import { apiService } from '../services/api';
import { wsService } from '../services/websocket';
import { useWebSocketContext } from '../context/WebSocketContext';

const EXECUTE_METHOD = {
  data_collection: 'executeDataCollectionJob',
  preprocessing: 'executePreprocessingJob',
  tokenization: 'executeTokenizerJob',
  training: 'executeTrainingJob',
  finetuning: 'executeFinetuningJob',
  optimization: 'executeOptimizationJob',
  deployment: 'executeDeploymentJob',
};

export const usePipelineExecution = (pipeline, setPipeline) => {
  const { subscribeToExecution } = useWebSocketContext();

  const [isRunning, setIsRunning] = useState(false);
  const [executionId, setExecutionId] = useState(null);
  const [currentJobId, setCurrentJobId] = useState(null);
  const [executionLogs, setExecutionLogs] = useState([]);

  const log = useCallback((level, message, timestamp = Date.now()) => {
    setExecutionLogs((prev) => [
      ...prev,
      { timestamp: new Date(timestamp), level, message },
    ]);
  }, []);

  const clearLogs = useCallback(() => setExecutionLogs([]), []);

  // Called by WebSocket 'execution_update'
  const updatePipelineStatus = useCallback(
  (data) => {
    if (!data) return;

    const targetJobId = data.job_id ? String(data.job_id) : null;
    const targetNodeId = data.node_id ? String(data.node_id) : null;

    const matchesStage = (stage) => {
      if (targetJobId && stage.jobId) {
        return String(stage.jobId) === targetJobId;
      }
      if (targetNodeId) {
        return String(stage.id) === targetNodeId;
      }
      return false;
    };

    if (data.node_status || data.pipeline_status) {
      setPipeline((prev) =>
        prev.map((stage) => {
          if (!matchesStage(stage)) return stage;
          return {
            ...stage,
            status:
              data.node_status === 'completed'
                ? 'completed'
                : data.node_status === 'running'
                ? 'running'
                : data.node_status === 'failed'
                ? 'failed'
                : stage.status,
            progress:
              data.progress !== undefined ? data.progress : stage.progress,
            result: data.result ?? stage.result,
            error:
              data.node_status === 'failed'
                ? data.error || stage.error
                : null,
          };
        })
      );
    }

    if (data.message) {
      log(data.level || 'info', data.message, data.timestamp);
    }
  },
  [setPipeline, log]
);

  /* ------------------------------------------------------------------ */
  /* Shared: execute one stage's job                                     */
  /* ------------------------------------------------------------------ */

  const executeStageJob = useCallback(
    async (stage) => {
      const method = EXECUTE_METHOD[stage.type];
      if (!method) throw new Error(`No executor for stage type ${stage.type}`);
      if (!stage.jobId) throw new Error(`Stage ${stage.name} has no jobId`);

      // Optimistically mark running so canRunStage gates correctly
      // even before the WebSocket event arrives.
      setPipeline((prev) =>
        prev.map((s) =>
          s.id === stage.id
            ? { ...s, status: 'running', progress: 0, error: null }
            : s
        )
      );

      const result = await apiService[method](stage.jobId);
      const execId = result?.execution_id ?? null;

      if (execId) {
        setExecutionId(execId);
        setCurrentJobId(stage.jobId);
        subscribeToExecution(execId);  
      }

      return { execId, raw: result };
    },
    [setPipeline, subscribeToExecution]
  );


  /* ------------------------------------------------------------------ */
  /* Run the entire pipeline                                             */
  /* ------------------------------------------------------------------ */
  
  const run = useCallback(async () => {
    if (!pipeline.length) return { ok: false, reason: 'empty' };

    setIsRunning(true);
    clearLogs();

    try {
      // Kick off each stage's job
      for (const stage of pipeline) {
        if (!stage.jobId) continue;
        const method = EXECUTE_METHOD[stage.type];
        if (!method) continue;

        log('info', `Executing ${stage.name} (Job: ${stage.jobId})...`);
        const result = await apiService[method](stage.jobId);
        setExecutionId(result.execution_id);
        setCurrentJobId(stage.jobId);
        wsService.subscribeToExecution(result.execution_id);
        log('info', `${stage.name} execution started: ${result.execution_id}`);
      }

      const pipelineJson = {
        nodes: pipeline.map((s) => ({
          id: s.id,
          type: s.type,
          name: s.name,
          config: s.config,
          job_id: s.jobId,
        })),
        edges: pipeline.slice(1).map((_, i) => ({
          source: pipeline[i].id,
          target: pipeline[i + 1].id,
        })),
      };

      const result = await apiService.executePipelineDirectly({
        pipelineJson,
        priority: 'HIGH',
      });

      const execId = result?.execution_id ?? null;
      if (execId) {
        setExecutionId(execId);
        subscribeToExecution(execId);
      }
      log('info', `Pipeline execution started${execId ? `: ${execId}` : ''}`);

      return { ok: true };
    } catch (err) {
      log('error', `Execution failed: ${err.message || 'Unknown error'}`);
      return { ok: false, reason: err.message };
    } finally {
      setIsRunning(false);
    }
  }, [pipeline, executeStageJob, subscribeToExecution, log, clearLogs]);

    /* ------------------------------------------------------------------ */
  /* Run a single stage — the new entry point                            */
  /* ------------------------------------------------------------------ */

  const runStage = useCallback(
    async (stageId) => {
      const stage = pipeline.find((s) => s.id === stageId);
      if (!stage) {
        return { ok: false, reason: 'Stage not found' };
      }

      log('info', `Running stage ${stage.name}...`);

      try {
        const { execId } = await executeStageJob(stage);
        log(
          'info',
          execId
            ? `${stage.name} started: ${execId}`
            : `${stage.name} queued`
        );
        return { ok: true, executionId: execId };
      } catch (err) {
        log('error', `Stage ${stage.name} failed: ${err.message}`);
        setPipeline((prev) =>
          prev.map((s) =>
            s.id === stageId
              ? { ...s, status: 'failed', error: err.message }
              : s
          )
        );
        return { ok: false, reason: err.message };
      }
    },
    [pipeline, executeStageJob, setPipeline, log]
  );

  return {
   isRunning,
    executionId,
    currentJobId,
    executionLogs,
    run,
    runStage,
    clearLogs,
    updatePipelineStatus,
    log,
  };
};