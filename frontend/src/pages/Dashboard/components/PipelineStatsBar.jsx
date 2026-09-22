import { Paper, Grid, Typography, alpha } from '@mui/material';

export const PipelineStatsBar = ({ pipeline, theme }) => {
  if (!pipeline.length) return null;

  const stats = pipeline.reduce(
    (acc, s) => {
      acc.total++;
      if (s.status === 'completed') acc.completed++;
      else if (s.status === 'running') acc.running++;
      else if (s.status === 'failed') acc.failed++;
      else acc.pending++;
      return acc;
    },
    { total: 0, completed: 0, running: 0, failed: 0, pending: 0 }
  );

  const Cell = ({ label, value, color = 'text.primary' }) => (
    <Grid item xs={12} sm={6} md={3}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="h6" color={color}>{value}</Typography>
    </Grid>
  );

  return (
    <Paper sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05), mb: 2 }}>
      <Grid container spacing={2} alignItems="center">
        <Cell label="Total Stages" value={stats.total} />
        <Cell label="Completed" value={stats.completed} color="success.main" />
        <Cell label="In Progress" value={stats.running} color="info.main" />
        <Cell label="Pending" value={stats.pending} color="warning.main" />
      </Grid>
    </Paper>
  );
};