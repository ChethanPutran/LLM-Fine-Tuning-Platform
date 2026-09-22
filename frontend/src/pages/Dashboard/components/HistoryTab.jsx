import { Grid, Card, CardContent, Typography, Box, Paper } from '@mui/material';
import { HistoryItem } from './HistoryItem';

export const HistoryTab = ({
  pipelineHistory, onLoad, onDelete, onViewDetails,
  jobHistory, onViewJobDetails,
}) => (
  <Grid container spacing={3}>
    <Grid item xs={12} md={8}>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Saved Pipelines</Typography>
          {pipelineHistory.length === 0 ? (
            <Typography color="text.disabled" textAlign="center" py={4}>
              No saved pipelines yet. Build and save a pipeline to see it here.
            </Typography>
          ) : (
            pipelineHistory.map((item) => (
              <HistoryItem
                key={item.id}
                item={item}
                onLoad={onLoad}
                onDelete={onDelete}
                onViewDetails={onViewDetails}
              />
            ))
          )}
        </CardContent>
      </Card>
    </Grid>

    <Grid item xs={12} md={4}>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Recent Jobs</Typography>
          {jobHistory.length === 0 ? (
            <Typography color="text.disabled" textAlign="center" py={2}>No recent jobs</Typography>
          ) : (
            <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
              {jobHistory.slice(0, 10).map((job, idx) => (
                <Paper
                  key={idx}
                  sx={{ p: 1, mb: 1, cursor: 'pointer' }}
                  onClick={() => onViewJobDetails(job)}
                >
                  <Typography variant="caption" display="block">{job.job_id}</Typography>
                  <Typography variant="caption" color="text.secondary">Status: {job.status}</Typography>
                </Paper>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>
    </Grid>

    <Grid item xs={12} md={4}>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Pipeline Tips</Typography>
          {[
            'Save your pipelines to reuse them later',
            'Export pipelines to share with team members',
            'Import JSON files to load existing pipelines',
            'Click on any saved pipeline to load it',
          ].map((t) => (
            <Typography key={t} variant="body2" color="text.secondary" paragraph>• {t}</Typography>
          ))}
        </CardContent>
      </Card>
    </Grid>
  </Grid>
);