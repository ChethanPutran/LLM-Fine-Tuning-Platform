import { useState, useEffect, useCallback } from 'react';
import { settingsAPI } from '../../services/settingsAPI';
import { DEFAULT_SETTINGS } from './defaultSettings';

export const useSettings = () => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [backupList, setBackupList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(null);

  /* ---------------- Loaders ---------------- */
  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await settingsAPI.getSettings();
      if (response?.data) {
        setSettings((prev) => ({ ...prev, ...response.data }));
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadBackups = useCallback(async () => {
    try {
      const response = await settingsAPI.getBackups();
      setBackupList(response?.data || []);
    } catch (err) {
      console.error('Failed to load backups:', err);
    }
  }, []);

  useEffect(() => {
    loadSettings();
    loadBackups();
  }, [loadSettings, loadBackups]);

  /* ---------------- Flash success ---------------- */
  const flashSuccess = useCallback(() => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  }, []);

  /* ---------------- Mutations ---------------- */
  const updateSection = useCallback((section, field, value) => {
    setSettings((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  }, []);

  const saveSettings = useCallback(async () => {
    setLoading(true);
    setSaveError(null);
    try {
      await settingsAPI.saveSettings(settings);
      if (settings.general.theme === 'dark') {
        document.body.classList.add('dark-mode');
      } else {
        document.body.classList.remove('dark-mode');
      }
      flashSuccess();
    } catch (err) {
      console.error('Failed to save settings:', err);
      setSaveError(err.message || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  }, [settings, flashSuccess]);

  const resetSettings = useCallback(async () => {
    setLoading(true);
    try {
      await settingsAPI.resetSettings();
      await loadSettings();
      flashSuccess();
    } catch (err) {
      console.error('Failed to reset settings:', err);
      setSaveError('Failed to reset settings');
    } finally {
      setLoading(false);
    }
  }, [loadSettings, flashSuccess]);

  const exportSettings = useCallback(async () => {
    try {
      const data = await settingsAPI.exportSettings();
      const dataStr = JSON.stringify(data, null, 2);
      const dataUri =
        'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      const link = document.createElement('a');
      link.setAttribute('href', dataUri);
      link.setAttribute(
        'download',
        `settings_backup_${new Date().toISOString()}.json`
      );
      link.click();
      flashSuccess();
    } catch (err) {
      console.error('Failed to export settings:', err);
      setSaveError('Failed to export settings');
    }
  }, [flashSuccess]);

  const importSettings = useCallback(
    async (importData) => {
      setLoading(true);
      try {
        await settingsAPI.importSettings(importData);
        await loadSettings();
        flashSuccess();
      } catch (err) {
        console.error('Failed to import settings:', err);
        setSaveError('Failed to import settings');
      } finally {
        setLoading(false);
      }
    },
    [loadSettings, flashSuccess]
  );

  const createBackup = useCallback(async () => {
    try {
      await settingsAPI.createBackup();
      await loadBackups();
      flashSuccess();
    } catch (err) {
      console.error('Failed to create backup:', err);
      setSaveError('Failed to create backup');
    }
  }, [loadBackups, flashSuccess]);

  const restoreBackup = useCallback(
    async (backupId) => {
      setLoading(true);
      try {
        await settingsAPI.restoreBackup(backupId);
        await loadSettings();
        flashSuccess();
      } catch (err) {
        console.error('Failed to restore backup:', err);
        setSaveError('Failed to restore backup');
      } finally {
        setLoading(false);
      }
    },
    [loadSettings, flashSuccess]
  );

  const deleteBackup = useCallback(
    async (backupId) => {
      try {
        await settingsAPI.deleteBackup(backupId);
        await loadBackups();
      } catch (err) {
        console.error('Failed to delete backup:', err);
        setSaveError('Failed to delete backup');
      }
    },
    [loadBackups]
  );

  const clearSaveSuccess = useCallback(() => setSaveSuccess(false), []);
  return {
    settings,
    backupList,
    loading,
    saveSuccess,
    saveError,
    setSaveError,
    updateSection,
    clearSaveSuccess,
    loadSettings,
    saveSettings,
    resetSettings,
    exportSettings,
    importSettings,
    createBackup,
    restoreBackup,
    deleteBackup,
  };
};