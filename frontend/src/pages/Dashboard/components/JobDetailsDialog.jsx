import { Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Box, Typography, Chip, Paper, Button } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

export const JobDetailsDialog = ({ open, onClose, job, metrics }) => (
  <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
    <DialogTitle>
      Job Details
      <IconButton sx={{ position: 'absolute', right: 8, top: 8 }} onClick={onClose}>
        <CloseIcon />
      </IconButton>
    </DialogTitle>
    <DialogContent>
      {job && (
        <Box>
          <Typography variant="subtitle2">Job ID</Typography>
          <Typography variant="body2" color="text.secondary" paragraph>{job.id}</Typography>

          <Typography variant="subtitle2">Status</Typography>
          <Chip
            label={job.status}
            color={
              job.status === 'completed' ? 'success' :
              job.status === 'running' ? 'info' :
              job.status === 'failed' ? 'error' : 'default'
            }
            size="small"
            sx={{ mb: 2 }}
          />

          {metrics && Object.keys(metrics).length > 0 && (
            <>
              <Typography variant="subtitle2" gutterBottom>Metrics</Typography>
              <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                <Box component="pre" sx={{ m: 0, fontSize: '12px', overflow: 'auto' }}>
                  {JSON.stringify(metrics, null, 2)}
                </Box>
              </Paper>
            </>
          )}
        </Box>
      )}
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Close</Button>
    </DialogActions>
  </Dialog>
);