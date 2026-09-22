import {
  Grid, TextField, FormControlLabel, Switch,
} from '@mui/material';
import { Science, BugReport, Public } from '@mui/icons-material';
import { SettingCard } from '../components/SettingCard';

export const AdvancedTab = ({ values, onChange }) => (
  <Grid container spacing={3}>
    <Grid item xs={12} md={6}>
      <SettingCard title="Experimental" icon={<Science />}>
        <FormControlLabel
          control={<Switch checked={values.experimentalFeatures}
            onChange={(e) => onChange('experimentalFeatures', e.target.checked)} />}
          label="Enable Experimental Features" sx={{ mb: 2, display: 'block' }}
        />
        <FormControlLabel
          control={<Switch checked={values.telemetryEnabled}
            onChange={(e) => onChange('telemetryEnabled', e.target.checked)} />}
          label="Enable Telemetry" sx={{ mb: 2, display: 'block' }}
        />
        <FormControlLabel
          control={<Switch checked={values.crashReporting}
            onChange={(e) => onChange('crashReporting', e.target.checked)} />}
          label="Enable Crash Reporting" sx={{ mb: 2, display: 'block' }}
        />
        <FormControlLabel
          control={<Switch checked={values.performanceMode}
            onChange={(e) => onChange('performanceMode', e.target.checked)} />}
          label="Performance Mode"
        />
      </SettingCard>
    </Grid>

    <Grid item xs={12} md={6}>
      <SettingCard title="Debugging" icon={<BugReport />}>
        <FormControlLabel
          control={<Switch checked={values.debugTools}
            onChange={(e) => onChange('debugTools', e.target.checked)} />}
          label="Show Debug Tools" sx={{ mb: 2, display: 'block' }}
        />
        <FormControlLabel
          control={<Switch checked={values.verboseLogging}
            onChange={(e) => onChange('verboseLogging', e.target.checked)} />}
          label="Verbose Logging" sx={{ mb: 2, display: 'block' }}
        />
        <FormControlLabel
          control={<Switch checked={values.traceLogging}
            onChange={(e) => onChange('traceLogging', e.target.checked)} />}
          label="Trace Logging"
        />
      </SettingCard>
    </Grid>

    <Grid item xs={12}>
      <SettingCard title="Proxy Configuration" icon={<Public />}>
        <FormControlLabel
          control={<Switch checked={values.proxyEnabled}
            onChange={(e) => onChange('proxyEnabled', e.target.checked)} />}
          label="Enable Proxy" sx={{ mb: 2, display: 'block' }}
        />
        {values.proxyEnabled && (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField fullWidth label="Proxy URL"
                value={values.proxyUrl}
                onChange={(e) => onChange('proxyUrl', e.target.value)} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Username"
                value={values.proxyUsername}
                onChange={(e) => onChange('proxyUsername', e.target.value)} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Password" type="password"
                value={values.proxyPassword}
                onChange={(e) => onChange('proxyPassword', e.target.value)} />
            </Grid>
          </Grid>
        )}
      </SettingCard>
    </Grid>
  </Grid>
);