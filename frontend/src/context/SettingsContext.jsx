// src/context/SettingsContext.jsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import { settingsAPI } from '../services/settingsAPI';

const SettingsContext = createContext(null);

export const useSettingsContext = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettingsContext must be used within SettingsProvider');
  }
  return context;
};

/**
 * Backend response shape can vary:
 *   - the settings object itself          → { appName: '...', ... }
 *   - wrapped in `data`                   → { data: { appName: '...' } }
 *   - wrapped in `settings`               → { settings: { appName: '...' } }
 * This picks whichever key holds the payload.
 */
const unwrapSettings = (response) => {
  if (!response || typeof response !== 'object') return null;
  if (response.data && typeof response.data === 'object') return response.data;
  if (response.settings && typeof response.settings === 'object') return response.settings;
  return response;
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Guards against out-of-order responses from concurrent saves.
  const mutationIdRef = useRef(0);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await settingsAPI.getSettings();
      const payload = unwrapSettings(response);
      setSettings(payload);
      setError(null);
      return payload;
    } catch (err) {
      console.error('Failed to load settings:', err);
      setError(err?.message || 'Failed to load settings');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSettings = useCallback(async (newSettings) => {
    const requestId = ++mutationIdRef.current;
    const response = await settingsAPI.saveSettings(newSettings);
    const payload = unwrapSettings(response) ?? newSettings;
    // Only the most recent request wins
    if (requestId === mutationIdRef.current) {
      setSettings(payload);
      setError(null);
    }
    return payload;
  }, []);

  const resetSettings = useCallback(async () => {
    const requestId = ++mutationIdRef.current;
    const response = await settingsAPI.resetSettings();
    const payload = unwrapSettings(response);
    if (requestId === mutationIdRef.current) {
      setSettings(payload);
      setError(null);
    }
    return payload;
  }, []);

  useEffect(() => {
    loadSettings().catch(() => {
      /* error already stored in state */
    });
  }, [loadSettings]);

  const value = useMemo(
    () => ({
      settings,
      loading,
      error,
      updateSettings,
      resetSettings,
      reloadSettings: loadSettings,
    }),
    [settings, loading, error, updateSettings, resetSettings, loadSettings]
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};