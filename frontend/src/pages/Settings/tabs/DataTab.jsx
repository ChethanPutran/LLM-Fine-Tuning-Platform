import {
  Grid, TextField, FormControlLabel, Switch, Button,
  List, ListItem, ListItemIcon, ListItemText,
  ListItemSecondaryAction, IconButton, Tooltip,
} from '@mui/material';
import { Storage, Save, History as HistoryIcon,
         RestartAlt, Delete } from '@mui/icons-material';
import { SettingCard } from '../components/SettingCard';

const num = (onChange, field) => (e) => onChange(field, parseInt(e.target.value));

export const DataTab = ({
  values, onChange, backupList, onCreateBackup, onRestoreBackup, onDeleteBackup,
}) => (
  <>
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <SettingCard title="Storage" icon={<Storage />}>
          <TextField fullWidth label="Data Storage Path"
            value={values.dataStoragePath}
            onChange={(e) => onChange('dataStoragePath', e.target.value)} sx={{ mb: 2 }} />
          <TextField fullWidth type="number" label="Max File Size (MB)"
            value={values.maxFileSizeMB}
            onChange={num(onChange, 'maxFileSizeMB')} sx={{ mb: 2 }} />

          <FormControlLabel
            control={<Switch checked={values.compressionEnabled}
              onChange={(e) => onChange('compressionEnabled', e.target.checked)} />}
            label="Enable Compression" sx={{ mb: 2, display: 'block' }}
          />
          {values.compressionEnabled && (
            <TextField fullWidth type="number" label="Compression Level"
              value={values.compressionLevel}
              onChange={num(onChange, 'compressionLevel')}
              inputProps={{ min: 1, max: 9 }} sx={{ mb: 2 }} />
          )}
        </SettingCard>
      </Grid>

      <Grid item xs={12} md={6}>
        <SettingCard title="Backup & Cleanup" icon={<Save />}>
          <FormControlLabel
            control={<Switch checked={values.autoCleanup}
              onChange={(e) => onChange('autoCleanup', e.target.checked)} />}
            label="Auto Cleanup" sx={{ mb: 2, display: 'block' }}
          />
          {values.autoCleanup && (
            <TextField fullWidth type="number" label="Cleanup After (days)"
              value={values.cleanupDays} onChange={num(onChange, 'cleanupDays')} sx={{ mb: 2 }} />
          )}
          <FormControlLabel
            control={<Switch checked={values.backupEnabled}
              onChange={(e) => onChange('backupEnabled', e.target.checked)} />}
            label="Enable Automatic Backups" sx={{ mb: 2, display: 'block' }}
          />
          {values.backupEnabled && (
            <>
              <TextField fullWidth type="number" label="Backup Interval (hours)"
                value={values.backupInterval}
                onChange={num(onChange, 'backupInterval')} sx={{ mb: 2 }} />
              <TextField fullWidth type="number" label="Max Backups"
                value={values.maxBackups}
                onChange={num(onChange, 'maxBackups')} sx={{ mb: 2 }} />
            </>
          )}
          <Button variant="outlined" fullWidth onClick={onCreateBackup} startIcon={<Save />}>
            Create Backup Now
          </Button>
        </SettingCard>
      </Grid>
    </Grid>

    {backupList.length > 0 && (
      <SettingCard title="Backup History" icon={<HistoryIcon />}>
        <List>
          {backupList.map((backup) => (
            <ListItem key={backup.id}>
              <ListItemIcon><Save /></ListItemIcon>
              <ListItemText
                primary={backup.name}
                secondary={`Created: ${new Date(backup.createdAt).toLocaleString()} • Size: ${(backup.size / 1024).toFixed(2)} KB`}
              />
              <ListItemSecondaryAction>
                <Tooltip title="Restore">
                  <IconButton onClick={() => onRestoreBackup(backup.id)}><RestartAlt /></IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton onClick={() => onDeleteBackup(backup.id)}><Delete /></IconButton>
                </Tooltip>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </SettingCard>
    )}
  </>
);