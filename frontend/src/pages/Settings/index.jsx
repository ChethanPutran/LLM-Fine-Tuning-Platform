// src/pages/Settings/index.jsx
import React, { useState } from 'react';
import {
  Container, Paper, Divider, Tabs, Tab, Alert,
  LinearProgress, Snackbar, Box,
} from '@mui/material';
import {
  Settings as SettingsIcon, Palette, Speed, Memory, Storage,
  Cloud, Security, Api, DataObject,
} from '@mui/icons-material';

import { useSettings } from './useSettings';
import { TabPanel } from './components/TabPanel';
import { SettingsHeader } from './components/SettingsHeader';
import { ResetDialog } from './components/ResetDialog';
import { ImportDialog } from './components/ImportDialog';

import { GeneralTab } from './tabs/GeneralTab';
import { UITab } from './tabs/UITab';
import { ProcessingTab } from './tabs/ProcessingTab';
import { ModelsTab } from './tabs/ModelsTab';
import { DataTab } from './tabs/DataTab';
import { DeploymentTab } from './tabs/DeploymentTab';
import { SecurityTab } from './tabs/SecurityTab';
import { IntegrationsTab } from './tabs/IntegrationsTab';
import { AdvancedTab } from './tabs/AdvancedTab';

const TABS = [
  { label: 'General',      icon: <SettingsIcon />, section: 'general' },
  { label: 'UI',           icon: <Palette />,      section: 'ui' },
  { label: 'Processing',   icon: <Speed />,        section: 'processing' },
  { label: 'Models',       icon: <Memory />,       section: 'models' },
  { label: 'Data',         icon: <Storage />,      section: 'data' },
  { label: 'Deployment',   icon: <Cloud />,        section: 'deployment' },
  { label: 'Security',     icon: <Security />,     section: 'security' },
  { label: 'Integrations', icon: <Api />,          section: 'integrations' },
  { label: 'Advanced',     icon: <DataObject />,   section: 'advanced' },
];

const TAB_COMPONENTS = {
  general: GeneralTab,
  ui: UITab,
  processing: ProcessingTab,
  models: ModelsTab,
  data: DataTab,
  deployment: DeploymentTab,
  security: SecurityTab,
  integrations: IntegrationsTab,
  advanced: AdvancedTab,
};

const Settings = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [pendingImport, setPendingImport] = useState(null);

  const s = useSettings();
  const currentSection = TABS[activeTab].section;

  /* --------------------------- Handlers --------------------------- */

  const handleChange = (field, value) =>
    s.updateSection(currentSection, field, value);

  const handleImportFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        setPendingImport(JSON.parse(e.target.result));
        setImportDialogOpen(true);
      } catch {
        s.setSaveError('Invalid JSON file');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const confirmImport = async () => {
    await s.importSettings(pendingImport);
    setPendingImport(null);
    setImportDialogOpen(false);
  };

  const renderActiveTab = () => {
    const Component = TAB_COMPONENTS[currentSection];
    const shared = {
      values: s.settings[currentSection],
      onChange: handleChange,
    };

    if (currentSection === 'data') {
      return (
        <Component
          {...shared}
          backupList={s.backupList}
          onCreateBackup={s.createBackup}
          onRestoreBackup={(id) => {
            if (
              window.confirm(
                'Restoring a backup will overwrite current settings. Continue?'
              )
            ) {
              s.restoreBackup(id);
            }
          }}
          onDeleteBackup={s.deleteBackup}
        />
      );
    }

    return <Component {...shared} />;
  };

  /* --------------------------- Render --------------------------- */

  // Guard: don't render tabs until the initial settings payload is loaded.
  // Otherwise `s.settings[currentSection]` is undefined and every tab
  // will crash trying to read `values.appName` etc.
  const initialLoading = s.loading && !s.settings;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Paper sx={{ p: 3 }}>
        <SettingsHeader
          onClose={onClose}
          onReset={() => setResetDialogOpen(true)}
          onExport={s.exportSettings}
          onImportFile={handleImportFile}
          onRefresh={s.loadSettings}
          onSave={s.saveSettings}
          loading={s.loading}
        />

        {/* Inline error alert — this is enough; no error Snackbar needed */}
        {s.saveError && (
          <Alert
            severity="error"
            sx={{ mb: 2 }}
            onClose={() => s.setSaveError(null)}
          >
            {s.saveError}
          </Alert>
        )}

        {(s.loading || initialLoading) && <LinearProgress sx={{ mb: 2 }} />}

        <Divider sx={{ mb: 3 }} />

        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{ mb: 2 }}
          variant="scrollable"
          scrollButtons="auto"
        >
          {TABS.map((t) => (
            <Tab key={t.label} icon={t.icon} label={t.label} />
          ))}
        </Tabs>

        <TabPanel value={activeTab} index={activeTab}>
          {initialLoading ? (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <LinearProgress />
            </Box>
          ) : (
            renderActiveTab()
          )}
        </TabPanel>
      </Paper>

      <ResetDialog
        open={resetDialogOpen}
        onClose={() => setResetDialogOpen(false)}
        onConfirm={async () => {
          await s.resetSettings();
          setResetDialogOpen(false);
        }}
      />

      <ImportDialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        onConfirm={confirmImport}
      />

      {/* Success toast only. Error is shown inline above. */}
      <Snackbar
        open={s.saveSuccess}
        autoHideDuration={3000}
        onClose={s.clearSaveSuccess}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="success" onClose={s.clearSaveSuccess}>
          Settings saved successfully!
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Settings;