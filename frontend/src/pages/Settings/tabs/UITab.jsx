import {
  Grid, Typography, Slider, FormControl, InputLabel,
  Select, MenuItem,
} from '@mui/material';
import { Palette, Tablet } from '@mui/icons-material';
import { SettingCard } from '../components/SettingCard';
import { ColorPicker } from '../components/ColorPicker';

export const UITab = ({ values, onChange }) => (
  <Grid container spacing={3}>
    <Grid item xs={12} md={6}>
      <SettingCard title="Colors" icon={<Palette />}>
        <ColorPicker value={values.primaryColor} label="Primary Color"
          onChange={(c) => onChange('primaryColor', c)} />
        <ColorPicker value={values.secondaryColor} label="Secondary Color"
          onChange={(c) => onChange('secondaryColor', c)} sx={{ mt: 2 }} />
        <ColorPicker value={values.backgroundColor} label="Background Color"
          onChange={(c) => onChange('backgroundColor', c)} sx={{ mt: 2 }} />
      </SettingCard>
    </Grid>

    <Grid item xs={12} md={6}>
      <SettingCard title="Layout" icon={<Tablet />}>
        <Typography gutterBottom>Border Radius</Typography>
        <Slider value={values.borderRadius} min={0} max={24} step={1}
          onChange={(_, v) => onChange('borderRadius', v)} sx={{ mb: 2 }}
          marks={[{ value: 0, label: '0' }, { value: 8, label: '8' },
                  { value: 16, label: '16' }, { value: 24, label: '24' }]}
        />

        <Typography gutterBottom>Font Size (px)</Typography>
        <Slider value={values.fontSize} min={12} max={18} step={1}
          onChange={(_, v) => onChange('fontSize', v)} sx={{ mb: 2 }}
          marks={[{ value: 12, label: '12' }, { value: 14, label: '14' },
                  { value: 16, label: '16' }, { value: 18, label: '18' }]}
        />

        <FormControl fullWidth>
          <InputLabel>Density</InputLabel>
          <Select value={values.density} label="Density"
            onChange={(e) => onChange('density', e.target.value)}>
            <MenuItem value="compact">Compact</MenuItem>
            <MenuItem value="comfortable">Comfortable</MenuItem>
            <MenuItem value="spacious">Spacious</MenuItem>
          </Select>
        </FormControl>
      </SettingCard>
    </Grid>
  </Grid>
);