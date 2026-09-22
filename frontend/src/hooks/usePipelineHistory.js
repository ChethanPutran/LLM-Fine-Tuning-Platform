import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'pipelineHistory';

export const usePipelineHistory = () => {
  const [pipelineHistory, setPipelineHistory] = useState([]);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      setPipelineHistory(JSON.parse(raw));
    } catch {
      /* ignore malformed data */
    }
  }, []);

  const persist = useCallback((items) => {
    setPipelineHistory(items);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, []);

  const saveToHistory = useCallback(
    (pipeline, name) => {
      const item = {
        id: Date.now().toString(),
        name: name || `Pipeline ${new Date().toLocaleString()}`,
        stages: pipeline,
        createdAt: new Date().toISOString(),
        stageCount: pipeline.length,
      };
      persist([item, ...pipelineHistory.slice(0, 9)]);
      return item;
    },
    [pipelineHistory, persist]
  );

  const deleteFromHistory = useCallback(
    (id) => persist(pipelineHistory.filter((i) => i.id !== id)),
    [pipelineHistory, persist]
  );

  return { pipelineHistory, saveToHistory, deleteFromHistory };
};