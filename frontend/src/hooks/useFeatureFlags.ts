import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../api/client';
import type {
  FeatureFlag,
  CreateFeatureFlagDTO,
  UpdateFeatureFlagDTO,
  Environment,
} from '../types/featureFlag';

interface UseFeatureFlagsResult {
  flags: FeatureFlag[];
  loading: boolean;
  error: string | null;
  selectedEnvironment: Environment | undefined;
  setSelectedEnvironment: (env: Environment | undefined) => void;
  refreshFlags: () => Promise<void>;
  createFlag: (dto: CreateFeatureFlagDTO) => Promise<FeatureFlag>;
  updateFlag: (id: string, dto: UpdateFeatureFlagDTO) => Promise<FeatureFlag>;
  deleteFlag: (id: string) => Promise<void>;
  toggleFlag: (id: string) => Promise<FeatureFlag>;
}

export function useFeatureFlags(): UseFeatureFlagsResult {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEnvironment, setSelectedEnvironment] = useState<Environment | undefined>(undefined);

  const refreshFlags = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.getFlags(selectedEnvironment);
      setFlags(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch flags');
    } finally {
      setLoading(false);
    }
  }, [selectedEnvironment]);

  useEffect(() => {
    refreshFlags();
  }, [refreshFlags]);

  const createFlag = useCallback(async (dto: CreateFeatureFlagDTO): Promise<FeatureFlag> => {
    const newFlag = await apiClient.createFlag(dto);
    setFlags((prev) => [newFlag, ...prev]);
    return newFlag;
  }, []);

  const updateFlag = useCallback(async (id: string, dto: UpdateFeatureFlagDTO): Promise<FeatureFlag> => {
    const updatedFlag = await apiClient.updateFlag(id, dto);
    setFlags((prev) => prev.map((f) => (f.id === id ? updatedFlag : f)));
    return updatedFlag;
  }, []);

  const deleteFlag = useCallback(async (id: string): Promise<void> => {
    await apiClient.deleteFlag(id);
    setFlags((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const toggleFlag = useCallback(async (id: string): Promise<FeatureFlag> => {
    const updatedFlag = await apiClient.toggleFlag(id);
    setFlags((prev) => prev.map((f) => (f.id === id ? updatedFlag : f)));
    return updatedFlag;
  }, []);

  return {
    flags,
    loading,
    error,
    selectedEnvironment,
    setSelectedEnvironment,
    refreshFlags,
    createFlag,
    updateFlag,
    deleteFlag,
    toggleFlag,
  };
}
