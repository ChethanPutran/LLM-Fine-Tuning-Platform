import { useState } from 'react';
import {
  Grid, TextField, FormControl, InputLabel, Select, MenuItem,
  FormControlLabel, Switch, InputAdornment, IconButton,
} from '@mui/material';
import { Lock, VpnKey, Visibility, VisibilityOff } from '@mui/icons-material';
import { SettingCard } from '../components/SettingCard';

const num = (onChange, field) => (e) => onChange(field, parseInt(e.target.value));

export const SecurityTab = ({ values, onChange }) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <SettingCard title="Authentication" icon={<Lock />}>
          <FormControlLabel
            control={<Switch checked={values.enableAuth}
              onChange={(e) => onChange('enableAuth', e.target.checked)} />}
            label="Enable Authentication" sx={{ mb: 2, display: 'block' }}
          />
          {values.enableAuth && (
            <>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Auth Provider</InputLabel>
                <Select value={values.authProvider} label="Auth Provider"
                  onChange={(e) => onChange('authProvider', e.target.value)}>
                  <MenuItem value="jwt">JWT</MenuItem>
                  <MenuItem value="oauth2">OAuth2</MenuItem>
                  <MenuItem value="ldap">LDAP</MenuItem>
                  <MenuItem value="saml">SAML</MenuItem>
                </Select>
              </FormControl>

              <TextField fullWidth label="JWT Secret"
                value={values.jwtSecret}
                onChange={(e) => onChange('jwtSecret', e.target.value)}
                type={showPassword ? 'text' : 'password'}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />
              <TextField fullWidth type="number" label="Session Timeout (seconds)"
                value={values.sessionTimeout}
                onChange={num(onChange, 'sessionTimeout')} sx={{ mb: 2 }} />
            </>
          )}
          <FormControlLabel
            control={<Switch checked={values.twoFactorEnabled}
              onChange={(e) => onChange('twoFactorEnabled', e.target.checked)} />}
            label="Enable Two-Factor Authentication"
          />
        </SettingCard>
      </Grid>

      <Grid item xs={12} md={6}>
        <SettingCard title="API Security" icon={<VpnKey />}>
          <FormControlLabel
            control={<Switch checked={values.apiKeyRequired}
              onChange={(e) => onChange('apiKeyRequired', e.target.checked)} />}
            label="Require API Key" sx={{ mb: 2, display: 'block' }}
          />
          {values.apiKeyRequired && (
            <TextField fullWidth label="API Key Header"
              value={values.apiKeyHeader}
              onChange={(e) => onChange('apiKeyHeader', e.target.value)} sx={{ mb: 2 }} />
          )}

          <FormControlLabel
            control={<Switch checked={values.rateLimitEnabled}
              onChange={(e) => onChange('rateLimitEnabled', e.target.checked)} />}
            label="Enable Rate Limiting" sx={{ mb: 2, display: 'block' }}
          />
          {values.rateLimitEnabled && (
            <TextField fullWidth type="number" label="Rate Limit (requests per minute)"
              value={values.rateLimitPerMinute}
              onChange={num(onChange, 'rateLimitPerMinute')} sx={{ mb: 2 }} />
          )}

          <FormControlLabel
            control={<Switch checked={values.auditLogging}
              onChange={(e) => onChange('auditLogging', e.target.checked)} />}
            label="Enable Audit Logging" sx={{ mb: 2, display: 'block' }}
          />
          {values.auditLogging && (
            <TextField fullWidth type="number" label="Audit Log Retention (days)"
              value={values.auditLogRetention}
              onChange={num(onChange, 'auditLogRetention')} />
          )}
        </SettingCard>
      </Grid>
    </Grid>
  );
};