// utils/normalizeOptions.js
export const normalizeOptions = (response) => {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  // Common shapes: {data:[...]}, {options:[...]}, {results:[...]}, {categories:[...]} etc.
  for (const key of ["data", "options", "results", "items", "categories", "tasks", "models", "datasets"]) {
    if (Array.isArray(response[key])) return response[key];
  }
  // Last resort: first array-valued property
  for (const key of Object.keys(response)) {
    if (Array.isArray(response[key])) return response[key];
  }
  return [];
};

export const toOptionValue = (item) =>
  typeof item === "string" ? item : item?.value ?? item?.id ?? item?.name ?? "";

export const toOptionLabel = (item) =>
  typeof item === "string" ? item : item?.label ?? item?.name ?? item?.id ?? "";