import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Card, CardContent, Typography, TextField, Select, MenuItem,
  FormControl, InputLabel, FormControlLabel, Switch,
  Box, IconButton, Chip, Divider, CircularProgress, Slider,
  FormHelperText, InputAdornment,          
} from '@mui/material';
import { Settings } from '@mui/icons-material';
import { ArtifactSelect } from './ArtifactSelect';
import { sanitizeOutputName } from '../../../utils/artifacts';

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

const normalizeOptions = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  const candidateKeys = [
    'items', 'categories', 'tasks', 'models', 'datasets',
    'data', 'options', 'results',
  ];
  for (const k of candidateKeys) {
    if (Array.isArray(data[k])) return data[k];
  }
  for (const k of Object.keys(data)) {
    if (Array.isArray(data[k])) return data[k];
  }
  return [];
};

const toOption = (opt) => {
  if (typeof opt === 'string' || typeof opt === 'number') {
    return { value: opt, label: String(opt) };
  }
  const value = opt?.value ?? opt?.id ?? opt?.name ?? '';
  const label = opt?.label ?? opt?.name ?? opt?.id ?? String(value);
  return { value, label };
};

const collectDescendants = (allFields, rootKey) => {
  const result = new Set();
  const queue = [rootKey];
  while (queue.length) {
    const parent = queue.shift();
    allFields.forEach((f) => {
      if (f.dependsOn === parent && !result.has(f.key)) {
        result.add(f.key);
        queue.push(f.key);
      }
    });
  }
  return result;
};

/* ------------------------------------------------------------------ */
/* StageConfig                                                        */
/* ------------------------------------------------------------------ */

const StageConfig = ({ stage, onConfigChange, config = {}, errors = {} , artifacts = [], }) => {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [asyncOptions, setAsyncOptions] = useState({});
  const [loadingFields, setLoadingFields] = useState({});
  const [fetchErrors, setFetchErrors] = useState({});

  const prevDepsRef = useRef({});
  const seededRef = useRef(null);

  const allFields = useMemo(
    () => [...(stage?.fields || []), ...(stage?.advancedFields || [])],
    [stage]
  );

  /* ---------------- 1. Seed defaults to parent (once per stage) --- */
  useEffect(() => {
    if (!stage) return;
    const stageKey = stage.id ?? stage.name ?? '_';
    if (seededRef.current === stageKey) return;
    seededRef.current = stageKey;

    const seeded = {};
    allFields.forEach((f) => {
      if (f.default !== undefined) {
        seeded[f.key] = f.default;
      } else if (f.type === 'select') {
        const opts = f.options || [];
        if (opts.length) seeded[f.key] = opts[0];
      } else if (f.type === 'boolean' || f.type === 'checkbox') {
        seeded[f.key] = false;
      } else if (f.type === 'slider') {
        seeded[f.key] = f.min ?? 0;
      } else if (f.type === 'number') {
        seeded[f.key] = f.default ?? 0;
      }
    });

    if (typeof onConfigChange === 'function' && Object.keys(seeded).length) {
      onConfigChange({ ...seeded, ...config });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage?.id, stage?.name]);

  /* ---------------- 2. Dynamic option fetching -------------------- */

  const configRef = useRef(config);
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  const depSignature = useMemo(
    () =>
      allFields
        .filter((f) => typeof f.fetch_endpoint === 'function')
        .map(
          (f) =>
            `${f.key}::${f.dependsOn ? config[f.dependsOn] ?? '' : '__root__'}`
        )
        .join('|'),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allFields, config]
  );

  useEffect(() => {
    if (!stage) return;

    const stageId = stage.id ?? stage.name ?? '_';
    const dynamicFields = allFields.filter(
      (f) => typeof f.fetch_endpoint === 'function'
    );

    // ✅ BUGFIX 1: Unstick any spinner that was orphaned by a previous,
    // cancelled fetch. Any field that's actually going to fetch will
    // immediately set loading back to true below.
    setLoadingFields((prev) => {
      const next = { ...prev };
      dynamicFields.forEach((f) => {
        next[f.key] = false;
      });
      return next;
    });

    let cancelled = false;

    (async () => {
      for (const field of dynamicFields) {
        const depKey = field.dependsOn;
        const depValue = depKey ? configRef.current[depKey] : '__root__';

        // ✅ BUGFIX 2: Key the tracking entry by STAGE + field, so switching
        // stages doesn't inherit stale "already fetched" markers from a
        // previous stage.
        const trackingKey = `${stageId}::${field.key}`;
        if (prevDepsRef.current[trackingKey] === depValue) continue;

        if (depKey && !depValue) {
          if (!cancelled) {
            setAsyncOptions((p) => ({ ...p, [field.key]: [] }));
            setFetchErrors((p) => ({ ...p, [field.key]: null }));
          }
          continue;
        }

        if (!cancelled) {
          setLoadingFields((p) => ({ ...p, [field.key]: true }));
          setFetchErrors((p) => ({ ...p, [field.key]: null }));
        }

        try {
          const data = await field.fetch_endpoint(configRef.current);
          if (cancelled) return;

          // ✅ BUGFIX 3: Mark the fetch as done only AFTER it resolves, so a
          // cancelled fetch is retried next time the effect runs.
          prevDepsRef.current[trackingKey] = depValue;

          setAsyncOptions((p) => ({
            ...p,
            [field.key]: normalizeOptions(data),
          }));
        } catch (err) {
          if (cancelled) return;
          prevDepsRef.current[trackingKey] = depValue;

          console.error(`Fetch error for ${field.key}:`, err);
          setFetchErrors((p) => ({
            ...p,
            [field.key]: err?.message || 'Failed to load options',
          }));
          setAsyncOptions((p) => ({ ...p, [field.key]: [] }));
        } finally {
          if (!cancelled) {
            setLoadingFields((p) => ({ ...p, [field.key]: false }));
          }
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depSignature, stage?.id]);

  /* ---------------- 3. Change handler (recursive reset) ----------- */

  const handleChange = useCallback(
    (key, value) => {
      const newConfig = { ...config, [key]: value };

      const descendants = collectDescendants(allFields, key);
      descendants.forEach((dk) => {
        newConfig[dk] = '';
      });

      if (typeof onConfigChange === 'function') onConfigChange(newConfig);
    },
    [config, onConfigChange, allFields]
  );

  const handleOutputNameChange = useCallback(
  (kind, raw) => {
    const cleaned = sanitizeOutputName(raw);
    const next = {
      ...config,
      __output_names: {
        ...(config.__output_names || {}),
        [kind]: cleaned,
      },
    };
    if (typeof onConfigChange === 'function') onConfigChange(next);
  },
  [config, onConfigChange]
);

const currentOutputName = (kind) =>
  config.__output_names?.[kind] ?? kind;

  /* ---------------- 4. Field renderer ----------------------------- */

  const renderField = (field) => {
    const isEmpty = (v) => v === undefined || v === null || v === '';

    const resolvedDefault =
      field.default !== undefined
        ? field.default
        : field.type === 'boolean' || field.type === 'checkbox'
        ? false
        : field.type === 'slider'
        ? field.min ?? 0
        : field.type === 'number'
        ? 0
        : field.type === 'artifact'   // ← artifact has no default
        ? ''
        : '';

    const value = isEmpty(config[field.key])
      ? resolvedDefault
      : config[field.key];

    const rawOptions = field.fetch_endpoint
      ? asyncOptions[field.key] || []
      : field.options || [];
    const normalizedOptions = rawOptions.map(toOption);

    const isLoading = !!loadingFields[field.key];
    const depMissing = !!(field.dependsOn && !config[field.dependsOn]);
    const fieldError = fetchErrors[field.key] || errors[field.key] || '';
    const isDisabled = isLoading || depMissing;

    const helperText = depMissing
      ? `Select "${field.dependsOn}" first`
      : fieldError || '';

    if (field.type === 'artifact') {
      return (
        <Box key={field.key} sx={{ mb: 2 }}>
          <ArtifactSelect
            label={field.label}
            value={value ?? ''}
            onChange={(e) => handleChange(field.key, e.target.value)}
            disabled={isDisabled}
            accept={field.accept || []}
            artifacts={artifacts}
            helperText={helperText}
            error={!!fieldError}
            required={field.required}
          />
        </Box>
      );
    }

    if (field.type === 'select') {
      return (
        <Box key={field.key} sx={{ mb: 2 }}>
          <FormControl fullWidth disabled={isDisabled} error={!!fieldError}>
            <InputLabel>{field.label}</InputLabel>
            <Select
              value={value ?? ''}
              label={field.label}
              onChange={(e) => handleChange(field.key, e.target.value)}
              endAdornment={
                isLoading ? (
                  <CircularProgress size={20} sx={{ mr: 4 }} />
                ) : null
              }
            >
              {isLoading && (
                <MenuItem disabled value="">
                  <em>Loading…</em>
                </MenuItem>
              )}
              {!isLoading && normalizedOptions.length === 0 && (
                <MenuItem disabled value="">
                  <em>
                    {depMissing
                      ? `Select ${field.dependsOn} first`
                      : 'No options available'}
                  </em>
                </MenuItem>
              )}
              {!isLoading &&
                normalizedOptions.map((opt) => (
                  <MenuItem key={String(opt.value)} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
            </Select>
            {helperText ? <FormHelperText>{helperText}</FormHelperText> : null}
          </FormControl>
        </Box>
      );
    }

    if (field.type === 'boolean' || field.type === 'checkbox') {
      return (
        <Box key={field.key} sx={{ mb: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={Boolean(value)}
                onChange={(e) => handleChange(field.key, e.target.checked)}
              />
            }
            label={field.label}
          />
        </Box>
      );
    }

    if (field.type === 'slider') {
      const num = Number(value);
      return (
        <Box key={field.key} sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {field.label}: {Number.isFinite(num) ? num : 0}
          </Typography>
          <Slider
            value={Number.isFinite(num) ? num : 0}
            min={field.min ?? 0}
            max={field.max ?? 100}
            step={field.step ?? 1}
            valueLabelDisplay="auto"
            onChange={(_, nextValue) => handleChange(field.key, nextValue)}
          />
        </Box>
      );
    }

    return (
      <Box key={field.key} sx={{ mb: 2 }}>
        <TextField
          fullWidth
          multiline={field.type === 'textarea'}
          rows={field.rows || 3}
          type={field.type === 'number' ? 'number' : 'text'}
          label={field.label}
          value={value ?? ''}
          placeholder={field.placeholder}
          required={field.required}
          error={!!fieldError}
          helperText={helperText}
          inputProps={{ min: field.min, max: field.max, step: field.step }}
          onChange={(e) => {
            const raw = e.target.value;
            handleChange(
              field.key,
              field.type === 'number'
                ? raw === ''
                  ? ''
                  : Number(raw)
                : raw
            );
          }}
        />
      </Box>
    );
  };

  /* ---------------- 5. Render ------------------------------------- */

  if (!stage) return null;

  return (
    <Card
      variant="outlined"
      sx={{ borderRadius: 2, boxShadow: 'none', border: '1px solid #e0e0e0' }}
    >
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            mb: 2,
            alignItems: 'center',
          }}
        >
          <Typography variant="subtitle1" fontWeight="bold" color="text.secondary">
            {stage.name.toUpperCase()} CONFIGURATION
          </Typography>
          {stage.advancedFields?.length > 0 && (
            <IconButton onClick={() => setAdvancedOpen(!advancedOpen)} size="small">
              <Settings color={advancedOpen ? 'primary' : 'inherit'} />
            </IconButton>
          )}
        </Box>

        {/* ---------- Outputs (user-named artifacts) ---------- */}
{stage.produces?.length > 0 && (
  <Box sx={{ mb: 3 }}>
    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
      Outputs
    </Typography>
    <Typography
      variant="caption"
      color="text.disabled"
      sx={{ display: 'block', mb: 1.5 }}
    >
      Name each artifact this stage produces. Downstream stages will
      reference them by these names.
    </Typography>

    {stage.produces.map((prod) => {
      const value = currentOutputName(prod.kind);
      return (
        <TextField
          key={prod.kind}
          fullWidth
          size="small"
          label={prod.label ? `${prod.label} — output name` : 'Output name'}
          value={value}
          onChange={(e) => handleOutputNameChange(prod.kind, e.target.value)}
          sx={{ mb: 1.5 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Chip size="small" label={prod.kind} />
              </InputAdornment>
            ),
          }}
          helperText={
            value
              ? `Reference: @stage:${stage.id ?? '<this-stage>'}:${value}`
              : 'Required — pick a name'
          }
        />
      );
    })}

    <Divider sx={{ mt: 2 }} />
  </Box>
)}

        {stage.fields?.map(renderField)}

        {advancedOpen && (
          <>
            <Divider sx={{ my: 2 }}>
              <Chip label="Advanced" size="small" />
            </Divider>
            {stage.advancedFields?.map(renderField)}
          </>
        )}

      </CardContent>
    </Card>
  );
};

export default StageConfig;