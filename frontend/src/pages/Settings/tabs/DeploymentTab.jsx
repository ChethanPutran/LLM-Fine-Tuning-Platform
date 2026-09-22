import {
  Grid, TextField, FormControl, InputLabel, Select, MenuItem,
  FormControlLabel, Switch,
} from '@mui/material';
import { Cloud, BarChart } from '@mui/icons-material';
import { SettingCard } from '../components/SettingCard';

const num = (onChange, field) => (e) => onChange(field, parseInt(e.target.value));

export const DeploymentTab = ({ values, onChange }) => (
  <Grid container spacing={3}>
    <Grid item xs={12} md={6}>
      <SettingCard title="Server Configuration" icon={<Cloud />}>
        <TextField fullWidth type="number" label="Default Port"
          value={values.defaultPort} onChange={num(onChange, 'defaultPort')} sx={{ mb: 2 }} />
        <TextField fullWidth type="number" label="Number of Workers"
          value={values.workers} onChange={num(onChange, 'workers')} sx={{ mb: 2 }} />
        <TextField fullWidth type="number" label="Max Batch Size"
          value={values.maxBatchSize} onChange={num(onChange, 'maxBatchSize')} sx={{ mb: 2 }} />

        <FormControlLabel
          control={<Switch checked={values.enableMetrics}
            onChange={(e) => onChange('enableMetrics', e.target.checked)} />}
          label="Enable Metrics" sx={{ mb: 2, display: 'block' }}
        />
        {values.enableMetrics && (
          <TextField fullWidth type="number" label="Metrics Port"
            value={values.metricsPort} onChange={num(onChange, 'metricsPort')} />
        )}
      </SettingCard>
    </Grid>

    <Grid item xs={12} md={6}>
      <SettingCard title="Auto-scaling" icon={<BarChart />}>
        <FormControlLabel
          control={<Switch checked={values.autoScaling}
            onChange={(e) => onChange('autoScaling', e.target.checked)} />}
          label="Enable Auto-scaling" sx={{ mb: 2, display: 'block' }}
        />
        {values.autoScaling && (
          <>
            <TextField fullWidth type="number" label="Min Replicas"
              value={values.minReplicas} onChange={num(onChange, 'minReplicas')} sx={{ mb: 2 }} />
            <TextField fullWidth type="number" label="Max Replicas"
              value={values.maxReplicas} onChange={num(onChange, 'maxReplicas')} sx={{ mb: 2 }} />
            <TextField fullWidth type="number" label="Target CPU Utilization (%)"
              value={values.targetCPUUtilization}
              onChange={num(onChange, 'targetCPUUtilization')} sx={{ mb: 2 }} />
          </>
        )}
        <FormControl fullWidth>
          <InputLabel>Load Balancing Strategy</InputLabel>
          <Select value={values.loadBalancing} label="Load Balancing Strategy"
            onChange={(e) => onChange('loadBalancing', e.target.value)}>
            <MenuItem value="round_robin">Round Robin</MenuItem>
            <MenuItem value="least_connections">Least Connections</MenuItem>
            <MenuItem value="ip_hash">IP Hash</MenuItem>
            <MenuItem value="random">Random</MenuItem>
          </Select>
        </FormControl>
      </SettingCard>
    </Grid>
  </Grid>
);