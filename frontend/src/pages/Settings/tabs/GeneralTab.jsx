import {
  Grid, TextField, FormControl, InputLabel, Select, MenuItem,
  FormControlLabel, Switch,
} from '@mui/material';
import { Settings as SettingsIcon, Language, Notifications,
         LightMode, DarkMode, AutoMode } from '@mui/icons-material';
import { SettingCard } from '../components/SettingCard';

export const GeneralTab = ({ values, onChange }) => (
  <Grid container spacing={3}>
    <Grid item xs={12} md={6}>
      <SettingCard title="Application" icon={<SettingsIcon />}>
        <TextField fullWidth label="Application Name" value={values.appName}
          onChange={(e) => onChange('appName', e.target.value)} sx={{ mb: 2 }} />

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Environment</InputLabel>
          <Select value={values.environment} label="Environment"
            onChange={(e) => onChange('environment', e.target.value)}>
            <MenuItem value="development">Development</MenuItem>
            <MenuItem value="staging">Staging</MenuItem>
            <MenuItem value="production">Production</MenuItem>
          </Select>
        </FormControl>

        <FormControlLabel
          control={<Switch checked={values.debugMode}
            onChange={(e) => onChange('debugMode', e.target.checked)} />}
          label="Debug Mode" sx={{ display: 'block' }}
        />
      </SettingCard>
    </Grid>

    <Grid item xs={12} md={6}>
      <SettingCard title="Preferences" icon={<Language />}>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Theme</InputLabel>
          <Select value={values.theme} label="Theme"
            onChange={(e) => onChange('theme', e.target.value)}>
            <MenuItem value="light"><LightMode /> Light</MenuItem>
            <MenuItem value="dark"><DarkMode /> Dark</MenuItem>
            <MenuItem value="auto"><AutoMode /> Auto</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Language</InputLabel>
          <Select value={values.language} label="Language"
            onChange={(e) => onChange('language', e.target.value)}>
            <MenuItem value="en">English</MenuItem>
            <MenuItem value="zh">Chinese</MenuItem>
            <MenuItem value="es">Spanish</MenuItem>
            <MenuItem value="fr">French</MenuItem>
            <MenuItem value="de">German</MenuItem>
            <MenuItem value="ja">Japanese</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel>Timezone</InputLabel>
          <Select value={values.timezone} label="Timezone"
            onChange={(e) => onChange('timezone', e.target.value)}>
            <MenuItem value="UTC">UTC</MenuItem>
            <MenuItem value="America/New_York">America/New_York</MenuItem>
            <MenuItem value="Europe/London">Europe/London</MenuItem>
            <MenuItem value="Asia/Tokyo">Asia/Tokyo</MenuItem>
          </Select>
        </FormControl>
      </SettingCard>
    </Grid>

    <Grid item xs={12}>
      <SettingCard title="Notifications" icon={<Notifications />}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <FormControlLabel
              control={<Switch checked={values.notificationsEnabled}
                onChange={(e) => onChange('notificationsEnabled', e.target.checked)} />}
              label="Enable Notifications"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControlLabel
              control={<Switch checked={values.emailNotifications}
                disabled={!values.notificationsEnabled}
                onChange={(e) => onChange('emailNotifications', e.target.checked)} />}
              label="Email Notifications"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControlLabel
              control={<Switch checked={values.desktopNotifications}
                disabled={!values.notificationsEnabled}
                onChange={(e) => onChange('desktopNotifications', e.target.checked)} />}
              label="Desktop Notifications"
            />
          </Grid>
        </Grid>
      </SettingCard>
    </Grid>
  </Grid>
);