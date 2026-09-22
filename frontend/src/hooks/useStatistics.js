import { useState, useCallback, useEffect } from 'react';
import { apiService } from '../services/api';

const EMPTY = {
  totalJobs: 0,
  byStatus: {},
  byType: {},
  completedJobs: 0,
  failedJobs: 0,
  runningJobs: 0,
};

export const useStatistics = (autoRefresh = true) => {
  const [statistics, setStatistics] = useState(EMPTY);

  const loadStatistics = useCallback(async () => {
    try {
      const [d, t, dep] = await Promise.all([
        apiService.getDataCollectionStatistics(),
        apiService.getTrainingStatistics(),
        apiService.getDeploymentStatistics(),
      ]);

      setStatistics({
        totalJobs:
          (d.total_jobs || 0) + (t.total_jobs || 0) + (dep.total_jobs || 0),
        byStatus: {
          ...d.by_status,
          ...t.by_status,
          ...dep.by_status,
        },
        byType: {
          dataCollection: d.total_jobs || 0,
          training: t.total_jobs || 0,
          deployment: dep.total_jobs || 0,
        },
        completedJobs:
          (d.completed_jobs || 0) +
          (t.completed_jobs || 0) +
          (dep.completed_jobs || 0),
        failedJobs:
          (d.failed_jobs || 0) +
          (t.failed_jobs || 0) +
          (dep.failed_jobs || 0),
        runningJobs:
          (d.running_jobs || 0) +
          (t.running_jobs || 0) +
          (dep.running_jobs || 0),
      });
    } catch (err) {
      console.error('Failed to load statistics:', err);
    }
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    loadStatistics();
    const id = setInterval(loadStatistics, 30000);
    return () => clearInterval(id);
  }, [autoRefresh, loadStatistics]);

  return { statistics, loadStatistics };
};