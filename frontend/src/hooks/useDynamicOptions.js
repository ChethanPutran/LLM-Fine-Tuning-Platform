// hooks/useDynamicOptions.js
import { useEffect, useMemo, useState } from "react";
import { normalizeOptions } from "../utils/normalizeOptions";

export function useDynamicOptions(options, config) {
  const [dynamicOptions, setDynamicOptions] = useState({});
  const [loadingFields, setLoadingFields] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});

  // Build a stable dependency key so we don't refetch on every config change
  const depKey = useMemo(() => {
    if (!options) return "";
    return options
      .filter(o => o.fetch_endpoint)
      .map(o => `${o.key}::${o.dependsOn ? (config[o.dependsOn] ?? "") : ""}`)
      .join("|");
  }, [options, config]);

  useEffect(() => {
    if (!options) return;
    let cancelled = false;

    (async () => {
      for (const option of options) {
        if (!option.fetch_endpoint) continue;

        // Skip if a dependency isn't satisfied yet
        if (option.dependsOn && !config[option.dependsOn]) {
          setDynamicOptions(prev => ({ ...prev, [option.key]: [] }));
          continue;
        }

        setLoadingFields(prev => ({ ...prev, [option.key]: true }));
        setFieldErrors(prev => ({ ...prev, [option.key]: null }));

        try {
          const response = await option.fetch_endpoint(config);
          if (cancelled) return;
          const normalized = normalizeOptions(response);
          setDynamicOptions(prev => ({ ...prev, [option.key]: normalized }));
        } catch (err) {
          if (cancelled) return;
          console.error(`fetch_endpoint failed for "${option.key}":`, err);
          setFieldErrors(prev => ({ ...prev, [option.key]: err.message || "Failed to load" }));
          setDynamicOptions(prev => ({ ...prev, [option.key]: [] }));
        } finally {
          if (!cancelled) {
            setLoadingFields(prev => ({ ...prev, [option.key]: false }));
          }
        }
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depKey]);

  return { dynamicOptions, loadingFields, fieldErrors };
}