import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../api/client';
import type { Experiment, CreateExperimentDTO, ExperimentMetrics } from '../types/experiment';

interface UseExperimentsResult {
  experiments: Experiment[];
  loading: boolean;
  error: string | null;
  refreshExperiments: () => Promise<void>;
  createExperiment: (dto: CreateExperimentDTO) => Promise<Experiment>;
  startExperiment: (id: string) => Promise<Experiment>;
  stopExperiment: (id: string) => Promise<Experiment>;
  deleteExperiment: (id: string) => Promise<void>;
  getMetrics: (experimentId: string) => Promise<ExperimentMetrics>;
}

export function useExperiments(flagId?: string): UseExperimentsResult {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshExperiments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.getExperiments(flagId);
      setExperiments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch experiments');
    } finally {
      setLoading(false);
    }
  }, [flagId]);

  useEffect(() => {
    refreshExperiments();
  }, [refreshExperiments]);

  const createExperiment = useCallback(async (dto: CreateExperimentDTO): Promise<Experiment> => {
    const newExperiment = await apiClient.createExperiment(dto);
    setExperiments((prev) => [newExperiment, ...prev]);
    return newExperiment;
  }, []);

  const startExperiment = useCallback(async (id: string): Promise<Experiment> => {
    const updated = await apiClient.startExperiment(id);
    setExperiments((prev) => prev.map((e) => (e.id === id ? updated : e)));
    return updated;
  }, []);

  const stopExperiment = useCallback(async (id: string): Promise<Experiment> => {
    const updated = await apiClient.stopExperiment(id);
    setExperiments((prev) => prev.map((e) => (e.id === id ? updated : e)));
    return updated;
  }, []);

  const deleteExperiment = useCallback(async (id: string): Promise<void> => {
    await apiClient.deleteExperiment(id);
    setExperiments((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const getMetrics = useCallback(async (experimentId: string): Promise<ExperimentMetrics> => {
    return apiClient.getExperimentMetrics(experimentId);
  }, []);

  return {
    experiments,
    loading,
    error,
    refreshExperiments,
    createExperiment,
    startExperiment,
    stopExperiment,
    deleteExperiment,
    getMetrics,
  };
}
