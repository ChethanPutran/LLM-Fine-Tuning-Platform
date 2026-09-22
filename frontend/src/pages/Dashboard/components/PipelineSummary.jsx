import {
  Box, Typography, Card, CardContent, Chip, LinearProgress,
  IconButton, Divider, Tooltip,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  PlayArrow as PlayArrowIcon,
  DoubleArrow as DoubleArrowIcon,
} from '@mui/icons-material';

export const PipelineSummary = ({
  pipeline,
  onRemove,
  onRunStage,
  onRunDownstreamOf,
  canRunStage,
  isRunning,
  isCascadeActive = false,
}) => (
  <Box sx={{ mt: 4 }}>
    <Typography variant="h6" gutterBottom>
      Pipeline Summary
    </Typography>
    <Card variant="outlined">
      <CardContent>
        {pipeline.length === 0 ? (
          <Typography color="text.disabled" textAlign="center" py={4}>
            No stages added yet. Use the left panel to begin building your
            pipeline.
          </Typography>
        ) : (
          pipeline.map((node, i) => {
            const gate = canRunStage ? canRunStage(node) : { ok: true };
            const running = node.status === 'running';
            const stageDisabled =
              !gate.ok || isRunning || isCascadeActive || running;

            return (
              <Box key={node.id}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 1.5,
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Chip
                      label={i + 1}
                      size="small"
                      sx={{ bgcolor: node.color, color: 'white', minWidth: 32 }}
                    />
                    <Box>
                      <Typography variant="body2">
                        <strong>{node.name}</strong>
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {node.type}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {running && (
                      <LinearProgress
                        variant="determinate"
                        value={node.progress || 0}
                        sx={{ width: 60, height: 4, mr: 1 }}
                      />
                    )}
                    {node.status === 'completed' && (
                      <CheckCircleIcon color="success" fontSize="small" />
                    )}
                    {node.status === 'failed' && (
                      <ErrorIcon color="error" fontSize="small" />
                    )}

                    <Tooltip
                      title={
                        running
                          ? 'Running…'
                          : gate.ok
                          ? 'Run this stage only'
                          : gate.reason
                      }
                      arrow
                    >
                      <span>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => onRunStage?.(node.id)}
                          disabled={stageDisabled}
                        >
                          <PlayArrowIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>

                    <Tooltip
                      title={
                        isCascadeActive
                          ? 'A cascade is already running'
                          : 'Run this stage and every downstream stage'
                      }
                      arrow
                    >
                      <span>
                        <IconButton
                          size="small"
                          color="secondary"
                          onClick={() => onRunDownstreamOf?.(node.id)}
                          disabled={
                            isRunning || isCascadeActive || running
                          }
                        >
                          <DoubleArrowIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>

                    <IconButton
                      size="small"
                      onClick={() => onRemove(node.id)}
                      disabled={isRunning || running || isCascadeActive}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
                {i < pipeline.length - 1 && <Divider />}
              </Box>
            );
          })
        )}
      </CardContent>
    </Card>
  </Box>
);