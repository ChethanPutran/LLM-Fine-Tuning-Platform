import React, { useState, useCallback, useMemo } from 'react';
import {
  Card, CardContent, Typography, FormControl, InputLabel,
  Select, MenuItem, Box, Button, Tooltip, Chip,
} from '@mui/material';
import { Add as AddIcon, Lock as LockIcon } from '@mui/icons-material';
import StageConfig from './StageConfig';
import { STAGE_DEFINITIONS } from '../../../constants/pipelineStages';
import { JOB_CREATORS } from '../../../utils/jobCreators';
import {
  getAvailableArtifacts,
  sanitizeOutputName,
} from '../../../utils/artifacts';
import {
  validateStageConfig,
  mergeStageDefaults,
} from '../../../utils/stageConfig';
import { usePipelineDependencies } from '../../../hooks/usePipelineDependencies';



/* ------------------------------------------------------------------ */
/* Output-name helpers                                                */
/* ------------------------------------------------------------------ */

/**
 * Ensure `config.__output_names` has an entry for every `produces` entry
 * on the stage. Missing ones get a name based on the kind, suffixed with
 * _1, _2 … until unique against `usedNames`.
 *
 * Returns { config, names, errors }.
 */
const ensureOutputNames = (stageDef, config, usedNames) => {
  const produces = stageDef.produces || [];
  const existing = { ...(config.__output_names || {}) };
  const errors = {};

  // Reserve names already in use elsewhere, excluding this stage's own
  // previously-chosen names (in case the user edited them).
  const taken = new Set(usedNames);
  Object.values(existing).forEach((n) => taken.delete(n));

  produces.forEach((prod) => {
    let name = sanitizeOutputName(existing[prod.kind]);

    // Fall back to the kind if the user cleared the field
    if (!name) name = sanitizeOutputName(prod.kind);

    // Uniqueness: append _1, _2, … while taken
    let candidate = name;
    let i = 1;
    while (taken.has(candidate)) {
      candidate = `${name}_${i++}`;
    }
    taken.add(candidate);
    existing[prod.kind] = candidate;
  });

  // Post-condition: names must be non-empty (they can't be after the
  // fallback above) and unique within the stage.
  const seen = new Set();
  produces.forEach((prod) => {
    const n = existing[prod.kind];
    if (!n) {
      errors[prod.kind] = 'Output name is required';
    } else if (seen.has(n)) {
      errors[prod.kind] = `Duplicate output name "${n}"`;
    } else {
      seen.add(n);
    }
  });

  return {
    config: { ...config, __output_names: existing },
    errors,
  };
};

/** Names already used by stages currently in the pipeline. */
const collectUsedOutputNames = (pipeline) =>
  getAvailableArtifacts(pipeline).map((a) => a.outputName);

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */

export const StageBuilderPanel = ({
  pipeline = [],
  onAdd,
  isRunning,
  notify,
}) => {
  const [selectedType, setSelectedType] = useState('');
  const [currentConfig, setCurrentConfig] = useState({});
  const [validationErrors, setValidationErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const { canAdd, describeMissing } = usePipelineDependencies(pipeline);

  const stageDef = STAGE_DEFINITIONS.find((s) => s.id === selectedType);

  const artifacts = useMemo(
    () => getAvailableArtifacts(pipeline),
    [pipeline]
  );

  const handleAdd = useCallback(async () => {
    if (!stageDef) {
      notify('Please select a stage type', 'warning');
      return;
    }

    /* 1. Prerequisite-stage gate */
    const gate = canAdd(selectedType);
    if (!gate.ok) {
      notify(
        `Cannot add ${stageDef.name}. Needs ${describeMissing(gate.missing)}.`,
        'error'
      );
      return;
    }

    /* 2. Auto-fill missing output names, resolve collisions */
    const usedNames = collectUsedOutputNames(pipeline);
    const { config: namedConfig, errors: nameErrors } = ensureOutputNames(
      stageDef,
      currentConfig,
      usedNames
    );

    if (Object.keys(nameErrors).length > 0) {
      notify(
        `Please fix output names: ${Object.values(nameErrors).join(', ')}`,
        'error'
      );
      return;
    }

    /* 3. Required artifact inputs (unrelated to output names) */
    const allFields = [
      ...(stageDef.fields || []),
      ...(stageDef.advancedFields || []),
    ];
    const missingArtifact = allFields.find(
      (f) => f.type === 'artifact' && f.required && !namedConfig[f.key]
    );
    if (missingArtifact) {
      notify(
        `Please select "${missingArtifact.label}" — it must come from an upstream stage.`,
        'error'
      );
      return;
    }

    /* 4. Generic validation + defaults */
    const mergedConfig = mergeStageDefaults(stageDef, namedConfig);
    const errors = validateStageConfig(stageDef, mergedConfig);

    if (Object.keys(errors).length) {
      setValidationErrors(errors);
      notify(`Please fix: ${Object.values(errors).join(', ')}`, 'error');
      return;
    }

    /* 5. Create job, add stage */
    setLoading(true);
    try {
      const creator = JOB_CREATORS[selectedType];
      const jobResult = creator ? await creator(mergedConfig) : null;

      onAdd({
        id: `${selectedType}-${Date.now()}`,
        type: selectedType,
        name: stageDef.name,
        description: `${stageDef.name} stage`,
        config: mergedConfig,
        color: stageDef.color,
        status: 'pending',
        progress: 0,
        createdAt: new Date().toISOString(),
        jobId: jobResult?.job_id,
      });

      setSelectedType('');
      setCurrentConfig({});
      setValidationErrors({});
      notify(`${stageDef.name} added to pipeline`, 'success');
    } catch (err) {
      console.error('Failed to create stage job:', err);
      notify(`Failed to create ${stageDef.name} job: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [
    stageDef,
    currentConfig,
    selectedType,
    pipeline,
    canAdd,
    describeMissing,
    onAdd,
    notify,
  ]);

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Add New Stage
        </Typography>

        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Select Stage Type</InputLabel>
          <Select
            value={selectedType}
            label="Select Stage Type"
            onChange={(e) => {
              setSelectedType(e.target.value);
              setCurrentConfig({});
              setValidationErrors({});
            }}
            renderValue={(value) => {
              const def = STAGE_DEFINITIONS.find((s) => s.id === value);
              if (!def) return '';
              return (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      bgcolor: def.color,
                    }}
                  />
                  {def.name}
                </Box>
              );
            }}
          >
            {STAGE_DEFINITIONS.map((s) => {
              const { ok, missing } = canAdd(s.id);
              const item = (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    width: '100%',
                    opacity: ok ? 1 : 0.5,
                  }}
                >
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      bgcolor: s.color,
                    }}
                  />
                  <Box sx={{ flex: 1 }}>{s.name}</Box>
                  {!ok && (
                    <>
                      <LockIcon fontSize="small" color="disabled" />
                      <Chip
                        size="small"
                        variant="outlined"
                        label={`needs ${describeMissing(missing)}`}
                        sx={{ fontSize: 10 }}
                      />
                    </>
                  )}
                </Box>
              );

              return (
                <MenuItem key={s.id} value={s.id} disabled={!ok}>
                  {ok ? (
                    item
                  ) : (
                    <Tooltip title={`Add ${describeMissing(missing)} first`}>
                      <span style={{ width: '100%' }}>{item}</span>
                    </Tooltip>
                  )}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>

        {stageDef && (
          <Box>
            <StageConfig
              stage={stageDef}
              config={currentConfig}
              errors={validationErrors}
              artifacts={artifacts}
              onConfigChange={(next) => setCurrentConfig(next)}
            />
            <Button
              fullWidth
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAdd}
              disabled={isRunning || loading}
              sx={{ mt: 2, py: 1.5, borderRadius: 2 }}
            >
              {loading ? 'Creating...' : 'Add to Pipeline'}
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};