import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Alert, Typography } from '@mui/material';

export const ImportDialog = ({ open, onClose, onConfirm }) => (
  <Dialog open={open} onClose={onClose}>
    <DialogTitle>Import Settings</DialogTitle>
    <DialogContent>
      <Alert severity="info" sx={{ mb: 2 }}>
        Importing settings will overwrite your current configuration.
      </Alert>
      <Typography>Do you want to proceed with the import?</Typography>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Cancel</Button>
      <Button onClick={onConfirm} variant="contained">Import</Button>
    </DialogActions>
  </Dialog>
);