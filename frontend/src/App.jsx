// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { IconButton, Box } from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import CssBaseline from '@mui/material/CssBaseline';

import Navigation from './components/Navigation.jsx';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import { lightTheme, darkTheme, globalStyles } from './components/Theme.jsx';
import { WebSocketProvider } from './context/WebSocketContext.jsx';
import { SettingsProvider } from './context/SettingsContext.jsx';
import './App.css';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleTheme = () => setIsDarkMode((prev) => !prev);

  // Inject global styles exactly once
  useEffect(() => {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'global-styles';
    styleSheet.textContent = Object.entries(globalStyles)
      .map(([key, value]) => `${key} ${value}`)
      .join('\n');
    document.head.appendChild(styleSheet);

    return () => {
      // Clean up on unmount (helpful in HMR / StrictMode)
      document.getElementById('global-styles')?.remove();
    };
  }, []);

  return (
    <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
      <CssBaseline />
      <SettingsProvider>
        <WebSocketProvider>
          <BrowserRouter>
            <Navigation>
              <Routes>
                {/* Dashboard also has its own Settings drawer, so /settings
                    is a standalone page — keep both or delete one. */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Navigation>

            {/* Floating theme toggle — stays on top of every route */}
            <Box
              sx={{
                position: 'fixed',
                bottom: 16,
                left: 16,
                zIndex: 2000,
                display: 'flex',
                gap: 1,
              }}
            >
              <IconButton
                onClick={toggleTheme}
                title="Toggle Theme"
                sx={{
                  background: isDarkMode
                    ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
                    : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  color: '#ffffff',
                  '&:hover': { transform: 'scale(1.05)' },
                }}
              >
                {isDarkMode ? <Brightness7 /> : <Brightness4 />}
              </IconButton>
            </Box>
          </BrowserRouter>
        </WebSocketProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}

export default App;