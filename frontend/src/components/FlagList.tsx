import { useState } from 'react';
import type { FeatureFlag, Environment } from '../types/featureFlag';
import { Toggle } from './Toggle';
import { EnvironmentBadge } from './EnvironmentBadge';
import { RolloutSlider } from './RolloutSlider';

interface FlagListProps {
  flags: FeatureFlag[];
  loading: boolean;
  error: string | null;
  onToggle: (id: string) => Promise<void>;
  onUpdateRollout: (id: string, percentage: number) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  selectedEnvironment: Environment | undefined;
  onEnvironmentChange: (env: Environment | undefined) => void;
}

export function FlagList({
  flags,
  loading,
  error,
  onToggle,
  onUpdateRollout,
  onDelete,
  selectedEnvironment,
  onEnvironmentChange,
}: FlagListProps) {
  const [updatingFlags, setUpdatingFlags] = useState<Set<string>>(new Set());
  const [deletingFlag, setDeletingFlag] = useState<string | null>(null);

  const handleToggle = async (id: string) => {
    setUpdatingFlags((prev) => new Set(prev).add(id));
    try {
      await onToggle(id);
    } finally {
      setUpdatingFlags((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleRolloutChange = async (id: string, percentage: number) => {
    setUpdatingFlags((prev) => new Set(prev).add(id));
    try {
      await onUpdateRollout(id, percentage);
    } finally {
      setUpdatingFlags((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this flag?')) return;

    setDeletingFlag(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingFlag(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">Error: {error}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Environment Filter */}
      <div className="mb-6 flex items-center space-x-2">
        <span className="text-sm font-medium text-gray-700">Filter by environment:</span>
        <select
          value={selectedEnvironment || ''}
          onChange={(e) => onEnvironmentChange(e.target.value as Environment || undefined)}
          className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
        >
          <option value="">All environments</option>
          <option value="development">Development</option>
          <option value="staging">Staging</option>
          <option value="prod">Production</option>
        </select>
      </div>

      {/* Flags Table */}
      {flags.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500">No feature flags found.</p>
          <p className="text-sm text-gray-400 mt-1">Create your first flag to get started.</p>
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Flag
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Environment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Enabled
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rollout
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {flags.map((flag) => (
                <tr key={flag.id} className={deletingFlag === flag.id ? 'opacity-50' : ''}>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900 font-mono">
                        {flag.key}
                      </div>
                      {flag.description && (
                        <div className="text-sm text-gray-500 mt-1">
                          {flag.description}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <EnvironmentBadge environment={flag.environment} />
                  </td>
                  <td className="px-6 py-4">
                    <Toggle
                      enabled={flag.enabled}
                      onChange={() => handleToggle(flag.id)}
                      disabled={updatingFlags.has(flag.id)}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <RolloutSlider
                      value={flag.rolloutPercentage}
                      onChange={(pct) => handleRolloutChange(flag.id, pct)}
                      disabled={updatingFlags.has(flag.id) || !flag.enabled}
                    />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDelete(flag.id)}
                      disabled={deletingFlag === flag.id}
                      className="text-red-600 hover:text-red-900 text-sm font-medium disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
