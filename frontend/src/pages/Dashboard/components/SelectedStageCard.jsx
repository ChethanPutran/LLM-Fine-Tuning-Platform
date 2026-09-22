import {
  Card, CardContent, Box, Typography, Paper, IconButton,
  Button, Chip, Tooltip, Alert, LinearProgress,
} from '@mui/material';
import {
  Close as CloseIcon,
  PlayArrow as PlayArrowIcon,
  DoubleArrow as DoubleArrowIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  HourglassEmpty as PendingIcon,
  Sync as RunningIcon,
} from '@mui/icons-material';

const statusChipProps = (status) => {
  switch (status) {
    case 'completed':
      return { color: 'success', icon: <CheckCircleIcon />, label: 'Completed' };
    case 'running':
      return { color: 'info', icon: <RunningIcon />, label: 'Running' };
    case 'failed':
      return { color: 'error', icon: <ErrorIcon />, label: 'Failed' };
    default:
      return { color: 'default', icon: <PendingIcon />, label: 'Pending' };
  }
};

export const SelectedStageCard = ({
  stage,
  onClose,
  onRunStage,
  onRunDownstreamOf,
  canRunStage,
  isRunningPipeline = false,
  isCascadeActive = false,
}) => {
  if (!stage) return null;

  const gate = canRunStage ? canRunStage(stage) : { ok: true };
  const chip = statusChipProps(stage.status);
  const showProgress = stage.status === 'running';
  const actionsDisabled =
    !gate.ok || isRunningPipeline || isCascadeActive || stage.status === 'running';

  return (
    <Card sx={{ mt: 2 }}>
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <Box>
            <Typography variant="subtitle1" fontWeight="bold">
              {stage.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              Type: {stage.type}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip size="small" variant="outlined" {...chip} />
            <IconButton size="small" onClick={onClose}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {showProgress && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress variant="determinate" value={stage.progress || 0} />
            <Typography variant="caption" color="text.secondary">
              {stage.progress || 0}% complete
            </Typography>
          </Box>
        )}

        {stage.status === 'failed' && stage.error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {stage.error}
          </Alert>
        )}

        {stage.config && Object.keys(stage.config).length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Configuration
            </Typography>
            <Paper variant="outlined" sx={{ p: 1, bgcolor: 'grey.50' }}>
              <Box
                component="pre"
                sx={{ m: 0, fontSize: '12px', overflow: 'auto', maxHeight: 200 }}
              >
                {JSON.stringify(stage.config, null, 2)}
              </Box>
            </Paper>
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 1, mt: 3, flexWrap: 'wrap' }}>
          <Tooltip
            title={gate.ok ? 'Run this stage only' : gate.reason}
            arrow
            placement="top"
          >
            <span>
              <Button
                variant="contained"
                startIcon={<PlayArrowIcon />}
                onClick={() => onRunStage?.(stage.id)}
                disabled={actionsDisabled}
                size="small"
              >
                {stage.status === 'completed' ? 'Re-run stage' : 'Run stage'}
              </Button>
            </span>
          </Tooltip>

          <Tooltip
            title={
              isCascadeActive
                ? 'A cascade is already running'
                : 'Run this stage and every downstream stage in dependency order'
            }
            arrow
            placement="top"
          >
            <span>
              <Button
                variant="outlined"
                startIcon={<DoubleArrowIcon />}
                onClick={() => onRunDownstreamOf?.(stage.id)}
                disabled={
                  isRunningPipeline ||
                  isCascadeActive ||
                  stage.status === 'running'
                }
                size="small"
              >
                Run from here
              </Button>
            </span>
          </Tooltip>
        </Box>

        {!gate.ok && stage.status !== 'running' && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 1, display: 'block' }}
          >
            {gate.reason}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};