import { useState, useCallback } from 'react';
import { apiService } from '../services/api';

export const useJobs = () => {
  const [activeJobs, setActiveJobs] = useState([]);
  const [jobHistory, setJobHistory] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobMetrics, setJobMetrics] = useState(null);

  // Called by the WebSocket 'job_update' handler
  const updateFromSocket = useCallback((data) => {
    if (!data?.job_id) return;

    if (data.job_status) {
      setActiveJobs((prev) => {
        const existing = prev.find((j) => j.id === data.job_id);
        if (existing) {
          return prev.map((j) =>
            j.id === data.job_id ? { ...j, ...data.job_status } : j
          );
        }
        return [...prev, { id: data.job_id, ...data.job_status }];
      });
    }

    if (data.status) {
      setActiveJobs((prev) => prev.filter((j) => j.id !== data.job_id));
      setJobHistory((prev) => [data, ...prev.slice(0, 19)]);
    }
  }, []);

  const cancelJob = useCallback(async (jobId) => {
    await apiService.cancelTrainingJob(jobId);
  }, []);

  return {
    activeJobs,
    jobHistory,
    selectedJob,
    setSelectedJob,
    jobMetrics,
    setJobMetrics,
    updateFromSocket,
    cancelJob,
  };
};