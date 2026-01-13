import { useState } from 'react';
import type { Experiment, ExperimentMetrics } from '../types/experiment';
import type { FeatureFlag } from '../types/featureFlag';
import { ExperimentStatusBadge } from './ExperimentStatusBadge';

interface ExperimentListProps {
  experiments: Experiment[];
  flags: FeatureFlag[];
  loading: boolean;
  error: string | null;
  onStart: (id: string) => Promise<unknown>;
  onStop: (id: string) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
  onGetMetrics: (id: string) => Promise<ExperimentMetrics>;
}

export function ExperimentList({
  experiments,
  flags,
  loading,
  error,
  onStart,
  onStop,
  onDelete,
  onGetMetrics,
}: ExperimentListProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedMetrics, setExpandedMetrics] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<ExperimentMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);

  const getFlagKey = (flagId: string) => {
    const flag = flags.find((f) => f.id === flagId);
    return flag?.key ?? 'Unknown';
  };

  const handleStart = async (id: string) => {
    setActionLoading(id);
    try {
      await onStart(id);
    } finally {
      setActionLoading(null);
    }
  };

  const handleStop = async (id: string) => {
    setActionLoading(id);
    try {
      await onStop(id);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this experiment?')) return;
    setActionLoading(id);
    try {
      await onDelete(id);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleMetrics = async (experimentId: string) => {
    if (expandedMetrics === experimentId) {
      setExpandedMetrics(null);
      setMetrics(null);
      return;
    }

    setExpandedMetrics(experimentId);
    setMetricsLoading(true);
    try {
      const data = await onGetMetrics(experimentId);
      setMetrics(data);
    } catch {
      setMetrics(null);
    } finally {
      setMetricsLoading(false);
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

  if (experiments.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
        <p className="text-gray-500">No experiments found.</p>
        <p className="text-sm text-gray-400 mt-1">Create your first experiment to start A/B testing.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {experiments.map((experiment) => (
        <div
          key={experiment.id}
          className="bg-white rounded-lg border border-gray-200 overflow-hidden"
        >
          <div className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center space-x-3">
                  <h3 className="text-lg font-medium text-gray-900">
                    {experiment.name}
                  </h3>
                  <ExperimentStatusBadge status={experiment.status} />
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Flag: <span className="font-mono">{getFlagKey(experiment.flagId)}</span>
                </p>
                {experiment.description && (
                  <p className="text-sm text-gray-600 mt-2">{experiment.description}</p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                {experiment.status === 'draft' && (
                  <>
                    <button
                      onClick={() => handleStart(experiment.id)}
                      disabled={actionLoading === experiment.id}
                      className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
                    >
                      Start
                    </button>
                    <button
                      onClick={() => handleDelete(experiment.id)}
                      disabled={actionLoading === experiment.id}
                      className="px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </>
                )}
                {experiment.status === 'running' && (
                  <button
                    onClick={() => handleStop(experiment.id)}
                    disabled={actionLoading === experiment.id}
                    className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                  >
                    Stop
                  </button>
                )}
                {experiment.status === 'stopped' && (
                  <button
                    onClick={() => handleDelete(experiment.id)}
                    disabled={actionLoading === experiment.id}
                    className="px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>

            {/* Variants */}
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Variants</h4>
              <div className="flex flex-wrap gap-2">
                {experiment.variants.map((variant) => (
                  <div
                    key={variant.id}
                    className="px-3 py-1.5 bg-gray-100 rounded-md text-sm"
                  >
                    <span className="font-medium">{variant.name}</span>
                    <span className="text-gray-500 ml-2">{variant.weight}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Metrics toggle */}
            {(experiment.status === 'running' || experiment.status === 'stopped') && (
              <button
                onClick={() => handleToggleMetrics(experiment.id)}
                className="mt-4 text-sm text-indigo-600 hover:text-indigo-800"
              >
                {expandedMetrics === experiment.id ? 'Hide Metrics' : 'View Metrics'}
              </button>
            )}
          </div>

          {/* Metrics Panel */}
          {expandedMetrics === experiment.id && (
            <div className="border-t border-gray-200 bg-gray-50 p-4">
              {metricsLoading ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                </div>
              ) : metrics ? (
                <div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Total Events</p>
                      <p className="text-xl font-semibold">{metrics.totalEvents}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Unique Users</p>
                      <p className="text-xl font-semibold">{metrics.uniqueUsers}</p>
                    </div>
                  </div>

                  <h5 className="text-sm font-medium text-gray-700 mb-2">Variant Performance</h5>
                  <div className="space-y-2">
                    {metrics.variantMetrics.map((vm) => (
                      <div
                        key={vm.variantId}
                        className="flex justify-between items-center p-2 bg-white rounded border"
                      >
                        <div>
                          <span className="font-medium">{vm.variantName}</span>
                          <span className="text-gray-500 text-sm ml-2">({vm.weight}%)</span>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-semibold text-indigo-600">
                            {vm.conversionRate.toFixed(1)}%
                          </span>
                          <span className="text-xs text-gray-500 ml-2">
                            ({vm.uniqueUsers} users)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  No metrics available yet. Track events to see results.
                </p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
