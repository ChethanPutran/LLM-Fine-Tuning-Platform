// src/pages/Dashboard/index.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Box, Typography, Chip, Tooltip, IconButton,
  Tabs, Tab, Snackbar, Alert, Zoom, Fab,
  useTheme,
} from '@mui/material';
import {
  Timeline as TimelineIcon,
  History as HistoryIcon,
  Assessment as AssessmentIcon,
  PlayArrow as PlayArrowIcon,
  Work as WorkIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  TrendingUp as StatsIcon,
} from '@mui/icons-material';

import { ExecutionMonitor } from './components/ExecutionMonitor';

import { TabPanel } from './components/TabPanel';
import { StatsCards } from './components/StatsCards';
import { PipelineStatsBar } from './components/PipelineStatsBar';
import { BuilderTab } from './components/BuilderTab';
import { HistoryTab } from './components/HistoryTab';
import { ActiveJobsTab } from './components/ActiveJobsTab';
import { ExecutionLogsTab } from './components/ExecutionLogsTab';
import { SavePipelineDialog } from './components/SavePipelineDialog';
import { JobDetailsDialog } from './components/JobDetailsDialog';
import { rehydrateJobs } from '../../utils/rehydrateJobs';

import { useWebSocketContext } from '../../context/WebSocketContext';
import { useStatistics } from '../../hooks/useStatistics';
import { usePipelineHistory } from '../../hooks/usePipelineHistory';
import { useJobs } from '../../hooks/useJobs';
import { usePipelineExecution } from '../../hooks/usePipelineExecution';

const TABS = [
  { label: 'Pipeline Builder', icon: <TimelineIcon /> },
  { label: 'History', icon: <HistoryIcon /> },
  { label: 'Active Jobs', icon: <WorkIcon /> },
  { label: 'Execution Logs', icon: <AssessmentIcon /> },
];

const Dashboard = () => {
  const theme = useTheme();

  // Single source of truth for connection state — comes from WebSocketProvider
  const { isConnected: wsConnected, subscribe } = useWebSocketContext();

  const [currentTab, setCurrentTab] = useState(0);
  const [pipeline, setPipeline] = useState([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [jobDetailsDialog, setJobDetailsDialog] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info',
  });

  const notify = useCallback(
    (message, severity = 'info') => setSnackbar({ open: true, message, severity }),
    []
  );
  const closeSnackbar = useCallback(
    () => setSnackbar((s) => ({ ...s, open: false })),
    []
  );

  const { statistics, loadStatistics } = useStatistics(autoRefresh);
  const { pipelineHistory, saveToHistory, deleteFromHistory } = usePipelineHistory();
  const jobs = useJobs();

  // usePipelineExecution now pulls subscribeToExecution from the context itself,
  // so Dashboard just passes pipeline + setter.
  const execution = usePipelineExecution(pipeline, setPipeline);

  // -------------------- WebSocket event subscriptions --------------------
  // The provider already handles connect/disconnect. We only register listeners.
  useEffect(() => {
    const offExec = subscribe('execution_update', (data) => {
      console.log('Execution update received:', data);
      execution.updatePipelineStatus(data);
    });

    const offJob = subscribe('job_update', (data) => {
      console.log('Job update received:', data);
      jobs.updateFromSocket(data);
    });

    return () => {
      offExec();
      offJob();
      // No wsService.disconnect() here — the provider owns the socket lifecycle.
    };
  }, [subscribe, execution.updatePipelineStatus, jobs.updateFromSocket]);

  // -------------------- Handlers --------------------
  const handleRun = useCallback(async () => {
    const result = await execution.run();
    if (result.ok) notify('Pipeline execution started successfully!', 'success');
    else if (result.reason === 'empty')
      notify('Please add stages to the pipeline first', 'warning');
    else notify('Pipeline execution failed', 'error');
  }, [execution, notify]);

  const handleSave = useCallback(
    (name) => {
      saveToHistory(pipeline, name);
      notify('Pipeline saved successfully!', 'success');
    },
    [pipeline, saveToHistory, notify]
  );

  const handleViewJobDetails = useCallback(
    (job) => {
      jobs.setSelectedJob(job);
      setJobDetailsDialog(true);
    },
    [jobs]
  );

  const handleCancelJob = useCallback(
    async (id) => {
      try {
        await jobs.cancelJob(id);
        notify('Job cancelled successfully', 'success');
      } catch (err) {
        console.error(err);
        notify('Failed to cancel job', 'error');
      }
    },
    [jobs, notify]
  );

  const handleLoadFromHistory = useCallback(
  async (item) => {
    notify(`Re-registering jobs for "${item.name}"…`, 'info');
    try {
      const rehydrated = await rehydrateJobs(item.stages);
      setPipeline(rehydrated);
      setCurrentTab(0);

      const failed = rehydrated.filter((s) => !s.jobId).length;
      if (failed > 0) {
        notify(
          `Loaded "${item.name}" — ${failed} stage${
            failed > 1 ? 's' : ''
          } failed to register`,
          'warning'
        );
      } else {
        notify(`Loaded "${item.name}"`, 'success');
      }
    } catch (err) {
      console.error(err);
      notify(`Failed to load "${item.name}"`, 'error');
    }
  },
  [setPipeline, notify]
);

  // -------------------- Render --------------------
  return (
    <Container maxWidth="xl" sx={{ py: 4, position: 'relative' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 2,
          }}
        >
          <Box>
            <Typography variant="h4" fontWeight="700" gutterBottom>
              ML Pipeline Builder
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Design, visualize, and execute machine learning pipelines with real-time monitoring
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Refresh Statistics">
              <IconButton onClick={loadStatistics} color="primary">
                <StatsIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="Connection Status">
              <Chip
                icon={wsConnected ? <CheckCircleIcon /> : <ErrorIcon />}
                label={wsConnected ? 'Connected' : 'Disconnected'}
                color={wsConnected ? 'success' : 'error'}
                variant="outlined"
                size="small"
              />
            </Tooltip>
          </Box>
        </Box>

        <StatsCards statistics={statistics} theme={theme} />
        <PipelineStatsBar pipeline={pipeline} theme={theme} />

        <Tabs
          value={currentTab}
          onChange={(_, v) => setCurrentTab(v)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          {TABS.map((t) => (
            <Tab key={t.label} label={t.label} icon={t.icon} iconPosition="start" />
          ))}
        </Tabs>
      </Box>

      <TabPanel value={currentTab} index={0}>
        <BuilderTab
          pipeline={pipeline}
          setPipeline={setPipeline}
          onRun={handleRun}
          onSave={() => setSaveDialogOpen(true)}
          isRunning={execution.isRunning}
          autoRefresh={autoRefresh}
          setAutoRefresh={setAutoRefresh}
          notify={notify}
          runStage={execution.runStage}
        />
      </TabPanel>

      <TabPanel value={currentTab} index={1}>
        <HistoryTab
          pipelineHistory={pipelineHistory}
          onLoad={handleLoadFromHistory}
          onDelete={deleteFromHistory}
          onViewDetails={(item) => {
            setPipeline(item.stages);
            setCurrentTab(0);
          }}
          jobHistory={jobs.jobHistory}
          onViewJobDetails={handleViewJobDetails}
        />
      </TabPanel>

      <TabPanel value={currentTab} index={2}>
        <ActiveJobsTab
          activeJobs={jobs.activeJobs}
          statistics={statistics}
          onCancel={handleCancelJob}
          onViewDetails={handleViewJobDetails}
        />
      </TabPanel>

      <TabPanel value={currentTab} index={3}>
        <ExecutionLogsTab
          logs={execution.executionLogs}
          onClear={execution.clearLogs}
          executionId={execution.executionId}
        />
      </TabPanel>

      {/* Dialogs */}
      <SavePipelineDialog
        open={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        onSave={handleSave}
        stageCount={pipeline.length}
      />
      <JobDetailsDialog
        open={jobDetailsDialog}
        onClose={() => setJobDetailsDialog(false)}
        job={jobs.selectedJob}
        metrics={jobs.jobMetrics}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} onClose={closeSnackbar} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* FAB */}
      {pipeline.length > 0 && !execution.isRunning && (
        <Zoom in>
          <Fab
            color="primary"
            sx={{ position: 'fixed', bottom: 24, right: 24 }}
            onClick={handleRun}
            title="Execute Pipeline"
          >
            <PlayArrowIcon />
          </Fab>
        </Zoom>
      )}

      {/* Execution Monitor */}
      {execution.executionId && (
        <Zoom in>
          <Box
            sx={{
              position: 'fixed',
              bottom: 80,
              right: 24,
              width: 400,
              zIndex: 1000,
            }}
          >
            <ExecutionMonitor executionId={execution.executionId} />
          </Box>
        </Zoom>
      )}
    </Container>
  );
};

export default Dashboard;