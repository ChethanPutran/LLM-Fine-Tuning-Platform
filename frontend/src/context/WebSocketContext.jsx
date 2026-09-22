// src/context/WebSocketContext.jsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from 'react';
import { wsService } from '../services/websocket';

const WebSocketContext = createContext(null);

export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [clientId, setClientId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleConnected = (data) => {
      setIsConnected(true);
      setClientId(data?.clientId ?? wsService.getClientId());
      setError(null);
    };

    const handleDisconnected = () => {
      setIsConnected(false);
    };

    const handleError = (err) => {
      // Normalize the WebSocket error event into something renderable
      const message =
        typeof err === 'string'
          ? err
          : err?.message || err?.reason || 'WebSocket error';
      setError(message);
    };

    const offConnected = wsService.on('connected', handleConnected);
    const offDisconnected = wsService.on('disconnected', handleDisconnected);
    const offError = wsService.on('error', handleError);

    // Single owner of the connection lifecycle.
    // The singleton guards against duplicate connections internally.
    wsService.connect().catch((err) => {
      console.error('WebSocket connect failed:', err);
      setError(err?.message || 'Failed to connect');
    });

    return () => {
      offConnected();
      offDisconnected();
      offError();
      // Do NOT call wsService.disconnect() here.
      // The singleton is app-wide; the provider should not tear it down
      // on every StrictMode double-mount or route change.
    };
  }, []);

  /* ---------------- Stable helper functions ---------------- */
  const send = useCallback((data) => wsService.send(data), []);

  const subscribeToExecution = useCallback(
    (executionId) => wsService.subscribeToExecution(executionId),
    []
  );
  const subscribeToJob = useCallback(
    (jobId) => wsService.subscribeToJob(jobId),
    []
  );
  const unsubscribeFromExecution = useCallback(
    (executionId) => wsService.unsubscribeFromExecution(executionId),
    []
  );
  const unsubscribeFromJob = useCallback(
    (jobId) => wsService.unsubscribeFromJob(jobId),
    []
  );
  const cancelExecution = useCallback(
    (executionId) => wsService.cancelExecution(executionId),
    []
  );
  const cancelJob = useCallback((jobId) => wsService.cancelJob(jobId), []);
  const getExecutionLogs = useCallback(
    (executionId, nodeId = null, tail = 100) =>
      wsService.getExecutionLogs(executionId, nodeId, tail),
    []
  );

  // Escape hatch: raw service for anything not wrapped above
  const subscribe = useCallback(
    (event, handler) => wsService.on(event, handler),
    []
  );

  const value = useMemo(
    () => ({
      isConnected,
      clientId,
      error,
      wsService, // still exported for advanced cases, but prefer the helpers
      send,
      subscribe, // wsService.on(event, handler) — returns unsubscribe
      subscribeToExecution,
      subscribeToJob,
      unsubscribeFromExecution,
      unsubscribeFromJob,
      cancelExecution,
      cancelJob,
      getExecutionLogs,
    }),
    [
      isConnected,
      clientId,
      error,
      send,
      subscribe,
      subscribeToExecution,
      subscribeToJob,
      unsubscribeFromExecution,
      unsubscribeFromJob,
      cancelExecution,
      cancelJob,
      getExecutionLogs,
    ]
  );

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};