import { Grid, TextField, FormControlLabel, Switch } from '@mui/material';
import { Speed, Timeline } from '@mui/icons-material';
import { SettingCard } from '../components/SettingCard';

const num = (onChange, field) => (e) => onChange(field, parseInt(e.target.value));

export const ProcessingTab = ({ values, onChange }) => (
  <Grid container spacing={3}>
    <Grid item xs={12} md={6}>
      <SettingCard title="Performance" icon={<Speed />}>
        <TextField fullWidth type="number" label="Default Batch Size"
          value={values.defaultBatchSize} onChange={num(onChange, 'defaultBatchSize')} sx={{ mb: 2 }} />
        <TextField fullWidth type="number" label="Maximum Workers"
          value={values.maxWorkers} onChange={num(onChange, 'maxWorkers')} sx={{ mb: 2 }} />
        <TextField fullWidth type="number" label="Memory Limit (MB)"
          value={values.memoryLimit} onChange={num(onChange, 'memoryLimit')} sx={{ mb: 2 }} />
        <FormControlLabel
          control={<Switch checked={values.cacheEnabled}
            onChange={(e) => onChange('cacheEnabled', e.target.checked)} />}
          label="Enable Cache" sx={{ mb: 2, display: 'block' }}
        />
        <FormControlLabel
          control={<Switch checked={values.parallelProcessing}
            onChange={(e) => onChange('parallelProcessing', e.target.checked)} />}
          label="Parallel Processing"
        />
      </SettingCard>
    </Grid>

    <Grid item xs={12} md={6}>
      <SettingCard title="Retry & Queue" icon={<Timeline />}>
        <TextField fullWidth type="number" label="Retry Attempts"
          value={values.retryAttempts} onChange={num(onChange, 'retryAttempts')} sx={{ mb: 2 }} />
        <TextField fullWidth type="number" label="Retry Delay (ms)"
          value={values.retryDelay} onChange={num(onChange, 'retryDelay')} sx={{ mb: 2 }} />
        <TextField fullWidth type="number" label="Max Queue Size"
          value={values.maxQueueSize} onChange={num(onChange, 'maxQueueSize')} sx={{ mb: 2 }} />
        <FormControlLabel
          control={<Switch checked={values.priorityQueue}
            onChange={(e) => onChange('priorityQueue', e.target.checked)} />}
          label="Priority Queue"
        />
      </SettingCard>
    </Grid>
  </Grid>
);