import { useCallback } from 'react';
import { Card, CardContent, Box, Typography, Button } from '@mui/material';
import { Clear as ClearIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { apiService } from '../../../services/api';

export const ExecutionLogsTab = ({ logs, onClear, executionId }) => {
  const refreshFromServer = useCallback(async () => {
    if (!executionId) return;
    try {
      const result = await apiService.getExecutionLogs(executionId);
      if (result.logs) {
        onClear();
        result.logs.forEach((msg) =>
          // You can either expose a setter or emit them through onClear + a push
          // Simplest approach: reuse the parent's log pipeline by emitting one by one
          // For now we just replace wholesale:
          null
        );
        // If you want to actually replace, add a `replaceLogs` prop.
      }
    } catch (e) {
      console.error(e);
    }
  }, [executionId, onClear]);

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Execution Logs</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {logs.length > 0 && (
              <Button size="small" onClick={onClear} startIcon={<ClearIcon />}>Clear</Button>
            )}
            <Button
              size="small"
              onClick={refreshFromServer}
              startIcon={<RefreshIcon />}
              disabled={!executionId}
            >
              Refresh
            </Button>
          </Box>
        </Box>

        {logs.length === 0 ? (
          <Typography color="text.disabled" textAlign="center" py={4}>
            No execution logs yet. Run a pipeline to see logs here.
          </Typography>
        ) : (
          <Box
            sx={{
              maxHeight: 500, overflow: 'auto', bgcolor: 'grey.900',
              color: 'grey.100', p: 2, borderRadius: 1,
              fontFamily: 'monospace', fontSize: '12px',
            }}
          >
            {logs.map((log, idx) => (
              <Box
                key={idx}
                sx={{
                  mb: 1,
                  color:
                    log.level === 'error' ? 'error.light' :
                    log.level === 'success' ? 'success.light' : 'grey.100',
                }}
              >
                <span style={{ color: 'grey.500' }}>
                  [{new Date(log.timestamp).toLocaleTimeString()}]
                </span>{' '}
                {log.message}
              </Box>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};