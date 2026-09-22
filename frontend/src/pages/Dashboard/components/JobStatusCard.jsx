import { Card, CardContent, Box, Typography, Chip, LinearProgress, Alert, Button } from '@mui/material';

export const JobStatusCard = ({ job, onCancel, onViewDetails }) => (
  <Card sx={{ mb: 1 }}>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="subtitle2">{job.name || `${job.type} Job`}</Typography>
          <Typography variant="caption" color="text.secondary">ID: {job.id}</Typography>
        </Box>
        <Chip
          size="small"
          label={job.status}
          color={
            job.status === 'completed' ? 'success' :
            job.status === 'running' ? 'info' :
            job.status === 'failed' ? 'error' :
            job.status === 'cancelled' ? 'warning' : 'default'
          }
        />
      </Box>

      {job.progress !== undefined && (
        <Box sx={{ mt: 1 }}>
          <LinearProgress variant="determinate" value={job.progress} sx={{ height: 4, borderRadius: 2 }} />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            {job.progress}% complete
          </Typography>
        </Box>
      )}

      {job.error && <Alert severity="error" sx={{ mt: 1, py: 0 }}>{job.error}</Alert>}

      <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
        <Button size="small" onClick={() => onViewDetails(job)}>Details</Button>
        {job.status === 'running' && (
          <Button size="small" color="error" onClick={() => onCancel(job.id)}>Cancel</Button>
        )}
      </Box>
    </CardContent>
  </Card>
);