import { Box, Typography, IconButton, Button } from '@mui/material';
import {
  Settings as SettingsIcon, Close as CloseIcon, RestartAlt,
  Download, Upload, Refresh, Save,
} from '@mui/icons-material';

export const SettingsHeader = ({
  onClose, onReset, onExport, onImportFile, onRefresh, onSave, loading,
}) => (
  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
    <SettingsIcon sx={{ fontSize: 32, mr: 2, color: 'primary.main' }} />
    <Typography variant="h4" component="h1">System Settings</Typography>
    <Box sx={{ flex: 1 }} />

    {onClose && (
      <IconButton onClick={onClose} sx={{ mr: 1 }}><CloseIcon /></IconButton>
    )}

    <Button variant="outlined" onClick={onReset} startIcon={<RestartAlt />} disabled={loading} sx={{ mr: 1 }}>
      Reset
    </Button>
    <Button variant="outlined" onClick={onExport} startIcon={<Download />} disabled={loading} sx={{ mr: 1 }}>
      Export
    </Button>
    <Button variant="outlined" component="label" startIcon={<Upload />} disabled={loading} sx={{ mr: 1 }}>
      Import
      <input type="file" hidden accept=".json" onChange={onImportFile} />
    </Button>
    <Button variant="outlined" onClick={onRefresh} startIcon={<Refresh />} disabled={loading} sx={{ mr: 1 }}>
      Refresh
    </Button>
    <Button variant="contained" onClick={onSave} startIcon={<Save />} disabled={loading}>
      Save Changes
    </Button>
  </Box>
);