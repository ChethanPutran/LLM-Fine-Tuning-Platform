import { Grid, Card, CardContent, Typography, List, ListItem, ListItemIcon, ListItemText, Divider, Box } from '@mui/material';
import {
  PlayArrow as PlayArrowIcon, CheckCircle as CheckCircleIcon,
  Error as ErrorIcon, DataUsage as DataIcon,
  ModelTraining as TrainingIcon, CloudUpload as DeployIcon,
} from '@mui/icons-material';
import { JobStatusCard } from './JobStatusCard';

export const ActiveJobsTab = ({ activeJobs, statistics, onCancel, onViewDetails }) => (
  <Grid container spacing={3}>
    <Grid item xs={12} md={8}>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Active Jobs</Typography>
          {activeJobs.length === 0 ? (
            <Typography color="text.disabled" textAlign="center" py={4}>No active jobs running.</Typography>
          ) : (
            <Box>
              {activeJobs.map((job) => (
                <JobStatusCard
                  key={job.id}
                  job={job}
                  onCancel={onCancel}
                  onViewDetails={onViewDetails}
                />
              ))}
            </Box>
          )}
        </CardContent>
      </Card>
    </Grid>

    <Grid item xs={12} md={4}>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Job Statistics</Typography>
          <List dense>
            <ListItem><ListItemIcon><PlayArrowIcon color="info" /></ListItemIcon><ListItemText primary="Running" secondary={statistics.runningJobs} /></ListItem>
            <ListItem><ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon><ListItemText primary="Completed" secondary={statistics.completedJobs} /></ListItem>
            <ListItem><ListItemIcon><ErrorIcon color="error" /></ListItemIcon><ListItemText primary="Failed" secondary={statistics.failedJobs} /></ListItem>
          </List>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" gutterBottom>By Type</Typography>
          <List dense>
            <ListItem><ListItemIcon><DataIcon /></ListItemIcon><ListItemText primary="Data Collection" secondary={statistics.byType?.dataCollection || 0} /></ListItem>
            <ListItem><ListItemIcon><TrainingIcon /></ListItemIcon><ListItemText primary="Training" secondary={statistics.byType?.training || 0} /></ListItem>
            <ListItem><ListItemIcon><DeployIcon /></ListItemIcon><ListItemText primary="Deployment" secondary={statistics.byType?.deployment || 0} /></ListItem>
          </List>
        </CardContent>
      </Card>
    </Grid>
  </Grid>
);