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

// Icons
const PlayIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const StopIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const ChartIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const ChevronIcon = ({ expanded }: { expanded: boolean }) => (
  <svg className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

const EmptyStateIcon = () => (
  <svg className="w-16 h-16 text-slate-300 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
  </svg>
);

// Variant colors for visual distinction
const variantColors = [
  'bg-violet-100 text-violet-700 ring-violet-600/20',
  'bg-fuchsia-100 text-fuchsia-700 ring-fuchsia-600/20',
  'bg-cyan-100 text-cyan-700 ring-cyan-600/20',
  'bg-amber-100 text-amber-700 ring-amber-600/20',
  'bg-emerald-100 text-emerald-700 ring-emerald-600/20',
];

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
      <div className="flex flex-col justify-center items-center h-64 gap-3">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-4 border-purple-100"></div>
          <div className="absolute top-0 left-0 w-12 h-12 rounded-full border-4 border-transparent border-t-purple-500 animate-spin"></div>
        </div>
        <span className="text-sm text-slate-500">Loading experiments...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="font-medium text-rose-800">Something went wrong</p>
            <p className="text-rose-600 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (experiments.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 border-dashed">
        <EmptyStateIcon />
        <p className="text-slate-600 font-medium mt-4">No experiments yet</p>
        <p className="text-sm text-slate-400 mt-1">Create your first experiment to start A/B testing</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {experiments.map((experiment) => (
        <div
          key={experiment.id}
          className="flag-card bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm"
        >
          <div className="p-5">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-slate-900">
                    {experiment.name}
                  </h3>
                  <ExperimentStatusBadge status={experiment.status} />
                </div>
                <p className="text-sm text-slate-500">
                  🏁 Flag: <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">{getFlagKey(experiment.flagId)}</code>
                </p>
                {experiment.description && (
                  <p className="text-sm text-slate-600 mt-2">{experiment.description}</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                {experiment.status === 'draft' && (
                  <>
                    <button
                      onClick={() => handleStart(experiment.id)}
                      disabled={actionLoading === experiment.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-emerald-500 rounded-lg hover:bg-emerald-600 disabled:opacity-50 transition-colors"
                    >
                      <PlayIcon />
                      Start
                    </button>
                    <button
                      onClick={() => handleDelete(experiment.id)}
                      disabled={actionLoading === experiment.id}
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                    >
                      <TrashIcon />
                    </button>
                  </>
                )}
                {experiment.status === 'running' && (
                  <button
                    onClick={() => handleStop(experiment.id)}
                    disabled={actionLoading === experiment.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-rose-500 rounded-lg hover:bg-rose-600 disabled:opacity-50 transition-colors"
                  >
                    <StopIcon />
                    Stop
                  </button>
                )}
                {experiment.status === 'stopped' && (
                  <button
                    onClick={() => handleDelete(experiment.id)}
                    disabled={actionLoading === experiment.id}
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                  >
                    <TrashIcon />
                  </button>
                )}
              </div>
            </div>

            {/* Variants */}
            <div className="mt-4">
              <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Variants</h4>
              <div className="flex flex-wrap gap-2">
                {experiment.variants.map((variant, idx) => (
                  <div
                    key={variant.id}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ring-1 ring-inset ${variantColors[idx % variantColors.length]}`}
                  >
                    <span className="font-medium">{variant.name}</span>
                    <span className="opacity-70">{variant.weight}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Metrics toggle */}
            {(experiment.status === 'running' || experiment.status === 'stopped') && (
              <button
                onClick={() => handleToggleMetrics(experiment.id)}
                className="mt-4 inline-flex items-center gap-2 text-sm text-violet-600 hover:text-violet-800 font-medium"
              >
                <ChartIcon />
                {expandedMetrics === experiment.id ? 'Hide Metrics' : 'View Metrics'}
                <ChevronIcon expanded={expandedMetrics === experiment.id} />
              </button>
            )}
          </div>

          {/* Metrics Panel */}
          {expandedMetrics === experiment.id && (
            <div className="border-t border-slate-200 bg-gradient-to-b from-slate-50 to-white p-5">
              {metricsLoading ? (
                <div className="flex justify-center py-6">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full border-4 border-violet-100"></div>
                    <div className="absolute top-0 left-0 w-8 h-8 rounded-full border-4 border-transparent border-t-violet-500 animate-spin"></div>
                  </div>
                </div>
              ) : metrics ? (
                <div>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="stat-card">
                      <p className="text-xs text-slate-500 uppercase tracking-wide">Total Events</p>
                      <p className="text-2xl font-bold text-slate-900 mt-1">{metrics.totalEvents.toLocaleString()}</p>
                    </div>
                    <div className="stat-card">
                      <p className="text-xs text-slate-500 uppercase tracking-wide">Unique Users</p>
                      <p className="text-2xl font-bold text-slate-900 mt-1">{metrics.uniqueUsers.toLocaleString()}</p>
                    </div>
                  </div>

                  <h5 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Variant Performance</h5>
                  <div className="space-y-2">
                    {metrics.variantMetrics.map((vm, idx) => (
                      <div
                        key={vm.variantId}
                        className="flex justify-between items-center p-3 bg-white rounded-lg border border-slate-200"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${variantColors[idx % variantColors.length].split(' ')[0]}`}></div>
                          <span className="font-medium text-slate-900">{vm.variantName}</span>
                          <span className="text-slate-400 text-sm">({vm.weight}%)</span>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-violet-600">
                            {vm.conversionRate.toFixed(1)}%
                          </span>
                          <span className="text-xs text-slate-400 ml-2">
                            ({vm.uniqueUsers.toLocaleString()} users)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-slate-500">📊 No metrics available yet</p>
                  <p className="text-sm text-slate-400 mt-1">Track events to see results</p>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
