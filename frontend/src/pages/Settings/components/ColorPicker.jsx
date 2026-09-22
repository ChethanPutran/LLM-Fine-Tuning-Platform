import { Box, TextField } from '@mui/material';

export const ColorPicker = ({ value, onChange, label, sx }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, ...sx }}>
    <Box
      sx={{
        width: 40, height: 40, borderRadius: 1, bgcolor: value,
        border: '1px solid #ddd', cursor: 'pointer',
      }}
      onClick={() => {
        const input = document.createElement('input');
        input.type = 'color';
        input.value = value;
        input.onchange = (e) => onChange(e.target.value);
        input.click();
      }}
    />
    <TextField label={label} value={value} onChange={(e) => onChange(e.target.value)} size="small" />
  </Box>
);