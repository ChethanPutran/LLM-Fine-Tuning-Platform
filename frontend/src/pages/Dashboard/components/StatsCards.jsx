import { Grid, Paper, Typography, alpha } from '@mui/material';

const Card = ({ label, value, color, theme }) => (
  <Paper sx={{ p: 2, bgcolor: alpha(theme.palette[color].main, 0.05) }}>
    <Typography variant="caption" color="text.secondary">{label}</Typography>
    <Typography variant="h5" color={`${color}.main`}>{value}</Typography>
  </Paper>
);

export const StatsCards = ({ statistics, theme }) => (
  <Grid container spacing={2} sx={{ mb: 2 }}>
    <Grid item xs={12} sm={6} md={3}>
      <Card label="Total Jobs" value={statistics.totalJobs} color="primary" theme={theme} />
    </Grid>
    <Grid item xs={12} sm={6} md={3}>
      <Card label="Completed" value={statistics.completedJobs} color="success" theme={theme} />
    </Grid>
    <Grid item xs={12} sm={6} md={3}>
      <Card label="Running" value={statistics.runningJobs} color="info" theme={theme} />
    </Grid>
    <Grid item xs={12} sm={6} md={3}>
      <Card label="Failed" value={statistics.failedJobs} color="error" theme={theme} />
    </Grid>
  </Grid>
);