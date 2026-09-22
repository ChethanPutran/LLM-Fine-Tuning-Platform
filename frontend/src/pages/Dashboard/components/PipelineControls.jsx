import { Card, CardContent, Typography, Grid, Button, Tooltip, Box } from '@mui/material';
import {
  Save as SaveIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Clear as ClearIcon,
  PlayArrow as PlayArrowIcon,
} from '@mui/icons-material';

export const PipelineControls = ({
  onSave,
  onExport,
  onImport,
  onClear,
  onRun,
  disabled,
  isRunning,
  canRun = true,        // ← new: gate for Run button
  runBlockReason = '',  // ← optional: tooltip text explaining why Run is blocked
}) => {
  const runDisabled = disabled || isRunning || !canRun;

  const runButton = (
    <Button
      fullWidth
      variant="contained"
      color="success"
      size="large"
      sx={{ mt: 1 }}
      startIcon={<PlayArrowIcon />}
      onClick={onRun}
      disabled={runDisabled}
    >
      {isRunning ? 'Executing Pipeline...' : 'Run Pipeline'}
    </Button>
  );

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Pipeline Controls
        </Typography>

        <Grid container spacing={1}>
          <Grid item xs={6}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<SaveIcon />}
              onClick={onSave}
              disabled={disabled}
              size="small"
            >
              Save
            </Button>
          </Grid>

          <Grid item xs={6}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={onExport}
              disabled={disabled}
              size="small"
            >
              Export
            </Button>
          </Grid>

          <Grid item xs={6}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={onImport}
              size="small"
            >
              Import
            </Button>
          </Grid>

          <Grid item xs={6}>
            <Button
              fullWidth
              variant="outlined"
              color="error"
              startIcon={<ClearIcon />}
              onClick={onClear}
              disabled={disabled || isRunning}
              size="small"
            >
              Clear All
            </Button>
          </Grid>

          <Grid item xs={12}>
            {/*
              When disabled with a reason, wrap in a Tooltip so the user
              understands why. MUI's Tooltip can't attach a ref to a
              disabled Button directly, so wrap it in a <span>.
            */}
            {runDisabled && runBlockReason ? (
              <Tooltip title={runBlockReason} arrow>
                <Box component="span" sx={{ display: 'block' }}>
                  {runButton}
                </Box>
              </Tooltip>
            ) : (
              runButton
            )}
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default PipelineControls;