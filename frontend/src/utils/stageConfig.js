export const validateStageConfig = (stageDef, config) => {
  const errors = {};
  const allFields = [
    ...(stageDef.fields || []),
    ...(stageDef.advancedFields || []),
  ];

  allFields.forEach((field) => {
    const v = config[field.key];
    if (field.required && (v === undefined || v === null || v === '')) {
      errors[field.key] = `${field.label} is required`;
    }
    if (field.type === 'number' && v !== undefined && v !== '') {
      const num = parseFloat(v);
      if (Number.isFinite(num)) {
        if (field.min !== undefined && num < field.min)
          errors[field.key] = `${field.label} must be at least ${field.min}`;
        if (field.max !== undefined && num > field.max)
          errors[field.key] = `${field.label} must be at most ${field.max}`;
      }
    }
  });

  return errors;
};

export const mergeStageDefaults = (stageDef, currentConfig = {}) => {
  const merged = { ...currentConfig };
  const allFields = [
    ...(stageDef.fields || []),
    ...(stageDef.advancedFields || []),
  ];

  allFields.forEach((field) => {
    const isEmpty =
      merged[field.key] === undefined ||
      merged[field.key] === null ||
      merged[field.key] === '';
    if (!isEmpty) return;

    if (field.default !== undefined) {
      merged[field.key] = field.default;
    } else if (field.type === 'select') {
      const opts = field.options || field.values || [];
      if (opts.length) merged[field.key] = opts[0];
    } else if (field.type === 'checkbox' || field.type === 'boolean') {
      merged[field.key] = false;
    } else if (field.type === 'slider') {
      merged[field.key] = field.default ?? 50;
    } else if (field.type === 'number') {
      merged[field.key] = field.default ?? 0;
    }
  });

  return merged;
};