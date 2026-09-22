import {
  Grid, TextField, FormControl, InputLabel, Select, MenuItem,
  FormControlLabel, Switch, Box, Chip,
} from '@mui/material';
import { Webhook, BarChart, Notifications } from '@mui/icons-material';
import { SettingCard } from '../components/SettingCard';

export const IntegrationsTab = ({ values, onChange }) => (
  <Grid container spacing={3}>
    <Grid item xs={12} md={6}>
      <SettingCard title="Webhooks" icon={<Webhook />}>
        <FormControlLabel
          control={<Switch checked={values.webhookEnabled}
            onChange={(e) => onChange('webhookEnabled', e.target.checked)} />}
          label="Enable Webhooks" sx={{ mb: 2, display: 'block' }}
        />
        {values.webhookEnabled && (
          <>
            <TextField fullWidth label="Webhook URL"
              value={values.webhookUrl}
              onChange={(e) => onChange('webhookUrl', e.target.value)} sx={{ mb: 2 }} />

            <FormControl fullWidth>
              <InputLabel>Webhook Events</InputLabel>
              <Select
                multiple
                value={values.webhookEvents}
                onChange={(e) => onChange('webhookEvents', e.target.value)}
                label="Webhook Events"
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
              >
                <MenuItem value="start">Pipeline Start</MenuItem>
                <MenuItem value="complete">Pipeline Complete</MenuItem>
                <MenuItem value="failed">Pipeline Failed</MenuItem>
                <MenuItem value="stage_complete">Stage Complete</MenuItem>
              </Select>
            </FormControl>
          </>
        )}
      </SettingCard>
    </Grid>

    <Grid item xs={12} md={6}>
      <SettingCard title="Monitoring" icon={<BarChart />}>
        <FormControlLabel
          control={<Switch checked={values.prometheusEnabled}
            onChange={(e) => onChange('prometheusEnabled', e.target.checked)} />}
          label="Enable Prometheus" sx={{ mb: 2, display: 'block' }}
        />
        {values.prometheusEnabled && (
          <TextField fullWidth label="Prometheus URL"
            value={values.prometheusUrl}
            onChange={(e) => onChange('prometheusUrl', e.target.value)} sx={{ mb: 2 }} />
        )}

        <FormControlLabel
          control={<Switch checked={values.grafanaEnabled}
            onChange={(e) => onChange('grafanaEnabled', e.target.checked)} />}
          label="Enable Grafana" sx={{ mb: 2, display: 'block' }}
        />
        {values.grafanaEnabled && (
          <TextField fullWidth label="Grafana URL"
            value={values.grafanaUrl}
            onChange={(e) => onChange('grafanaUrl', e.target.value)} />
        )}
      </SettingCard>
    </Grid>

    <Grid item xs={12}>
      <SettingCard title="Messaging" icon={<Notifications />}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Slack Webhook"
              value={values.slackWebhook}
              onChange={(e) => onChange('slackWebhook', e.target.value)} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Discord Webhook"
              value={values.discordWebhook}
              onChange={(e) => onChange('discordWebhook', e.target.value)} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Teams Webhook"
              value={values.teamsWebhook}
              onChange={(e) => onChange('teamsWebhook', e.target.value)} />
          </Grid>
        </Grid>
      </SettingCard>
    </Grid>
  </Grid>
);