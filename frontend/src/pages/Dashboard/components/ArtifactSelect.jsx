import React, { useMemo } from 'react';
import {
  FormControl, InputLabel, Select, MenuItem, FormHelperText,
  ListSubheader, Box, Chip, Typography,
} from '@mui/material';

export const ArtifactSelect = ({
  label,
  value,
  onChange,
  disabled,
  accept = [],
  artifacts = [],
  helperText = '',
  error = false,
  required = false,
}) => {
  const compatible = useMemo(
    () =>
      accept.length === 0
        ? artifacts
        : artifacts.filter((a) => accept.includes(a.kind)),
    [artifacts, accept]
  );

  // Group compatible artifacts by source stage.
  const groups = useMemo(() => {
    const map = new Map();
    compatible.forEach((a) => {
      if (!map.has(a.stageId)) {
        map.set(a.stageId, { stageName: a.stageName, items: [] });
      }
      map.get(a.stageId).items.push(a);
    });
    return [...map.values()];
  }, [compatible]);

  const selected = compatible.find((a) => a.value === value);

  return (
    <FormControl fullWidth error={error} disabled={disabled} sx={{ mb: 2 }}>
      <InputLabel required={required}>{label}</InputLabel>
      <Select
        value={value ?? ''}
        label={label}
        onChange={onChange}
        renderValue={(val) => {
          if (!val) {
            return (
              <Typography component="span" color="text.disabled" variant="body2">
                — select an upstream output —
              </Typography>
            );
          }
          if (!selected) {
            // Reference is stale (upstream stage was removed).
            return (
              <Typography component="span" color="error" variant="body2">
                ⚠ missing upstream output
              </Typography>
            );
          }
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip size="small" label={selected.stageName} />
              <span>{selected.outputLabel}</span>
            </Box>
          );
        }}
      >
        {groups.length === 0 && (
          <MenuItem disabled value="">
            <em>
              No upstream stage produces{' '}
              {accept.length ? accept.join(' / ') : 'a compatible artifact'}
            </em>
          </MenuItem>
        )}

        {groups.map((group) => [
          <ListSubheader key={`hdr-${group.stageName}`} disableSticky>
            {group.stageName}
          </ListSubheader>,
          ...group.items.map((a) => (
            <MenuItem key={a.value} value={a.value}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <span>{a.outputLabel}</span>
                <Typography component="span" color="text.secondary" variant="caption">
                  {a.kind}
                </Typography>
              </Box>
            </MenuItem>
          )),
        ])}
      </Select>
      {helperText ? <FormHelperText>{helperText}</FormHelperText> : null}
    </FormControl>
  );
};