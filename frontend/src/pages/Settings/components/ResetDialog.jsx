import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Alert, Typography } from '@mui/material';

export const ResetDialog = ({ open, onClose, onConfirm }) => (
  <Dialog open={open} onClose={onClose}>
    <DialogTitle>Reset Settings</DialogTitle>
    <DialogContent>
      <Alert severity="warning" sx={{ mb: 2 }}>
        This will reset all settings to their default values. This action cannot be undone.
      </Alert>
      <Typography>Are you sure you want to reset all settings?</Typography>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Cancel</Button>
      <Button onClick={onConfirm} variant="contained" color="error">Reset</Button>
    </DialogActions>
  </Dialog>
);