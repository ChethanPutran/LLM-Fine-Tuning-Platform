import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Typography } from '@mui/material';

export const SavePipelineDialog = ({ open, onClose, onSave, stageCount }) => {
  const [name, setName] = useState('');

  useEffect(() => {
    if (open) setName(`Pipeline ${new Date().toLocaleString()}`);
  }, [open]);

  const submit = () => {
    onSave(name.trim() || `Pipeline ${new Date().toLocaleString()}`);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Save Pipeline</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus margin="dense" label="Pipeline Name" fullWidth variant="outlined"
          value={name} onChange={(e) => setName(e.target.value)}
          placeholder="Enter a name for this pipeline"
        />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          {stageCount} stage{stageCount !== 1 ? 's' : ''} will be saved
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={submit} variant="contained">Save</Button>
      </DialogActions>
    </Dialog>
  );
};