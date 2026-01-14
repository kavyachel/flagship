import { useState } from 'react';
import type { FeatureFlag, Environment } from '../types/featureFlag';
import { Toggle } from './Toggle';
import { EnvironmentBadge } from './EnvironmentBadge';
import { RolloutSlider } from './RolloutSlider';
import { ConfirmDialog } from './ConfirmDialog';

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

// Icons
const FilterIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const CodeIcon = () => (
  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
  </svg>
);

const CopyIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const EmptyStateIcon = () => (
  <svg className="w-16 h-16 text-slate-300 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
  </svg>
);

// Skeleton loader for better loading state
function FlagSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-7 w-40 bg-slate-200 rounded-lg"></div>
            <div className="h-6 w-24 bg-slate-200 rounded-full"></div>
          </div>
          <div className="h-4 w-64 bg-slate-100 rounded"></div>
        </div>
        <div className="flex items-center gap-6">
          <div className="h-7 w-12 bg-slate-200 rounded-full"></div>
          <div className="h-6 w-32 bg-slate-200 rounded-lg"></div>
        </div>
      </div>
    </div>
  );
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
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; flag: FeatureFlag | null; loading: boolean }>({
    isOpen: false,
    flag: null,
    loading: false,
  });
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

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

  const handleDeleteClick = (flag: FeatureFlag) => {
    setDeleteDialog({ isOpen: true, flag, loading: false });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.flag) return;
    setDeleteDialog(prev => ({ ...prev, loading: true }));
    try {
      await onDelete(deleteDialog.flag.id);
      setDeleteDialog({ isOpen: false, flag: null, loading: false });
    } catch {
      setDeleteDialog(prev => ({ ...prev, loading: false }));
    }
  };

  const handleCopyKey = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      // Clipboard API not available
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="mb-6 flex items-center gap-3">
          <div className="h-8 w-48 bg-slate-200 rounded-lg animate-pulse"></div>
        </div>
        {[1, 2, 3].map((i) => (
          <FlagSkeleton key={i} />
        ))}
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

  return (
    <div>
      {/* Environment Filter */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <FilterIcon />
          <span>Filter:</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onEnvironmentChange(undefined)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
              !selectedEnvironment
                ? 'bg-violet-100 text-violet-700 ring-1 ring-violet-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All
          </button>
          {(['development', 'staging', 'prod'] as Environment[]).map((env) => (
            <button
              key={env}
              onClick={() => onEnvironmentChange(env)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all flex items-center gap-1.5 ${
                selectedEnvironment === env
                  ? 'bg-violet-100 text-violet-700 ring-1 ring-violet-200'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {env === 'prod' && '🚀'}
              {env === 'staging' && '🧪'}
              {env === 'development' && '🛠️'}
              {env}
            </button>
          ))}
        </div>
        <div className="ml-auto text-sm text-slate-500">
          {flags.length} flag{flags.length !== 1 && 's'}
        </div>
      </div>

      {/* Flags Grid */}
      {flags.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 border-dashed">
          <EmptyStateIcon />
          <p className="text-slate-600 font-medium mt-4">No feature flags yet</p>
          <p className="text-sm text-slate-400 mt-1">Press <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-mono text-xs">n</kbd> to create your first flag</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {flags.map((flag) => (
            <div
              key={flag.id}
              className={`
                flag-card bg-white rounded-xl border border-slate-200 p-5 shadow-sm
                ${updatingFlags.has(flag.id) ? 'opacity-70' : ''}
              `}
            >
              <div className="flex items-start justify-between gap-4">
                {/* Left: Flag info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="group flex items-center gap-2 px-2.5 py-1 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
                      <CodeIcon />
                      <code className="text-sm font-mono font-medium text-slate-700">
                        {flag.key}
                      </code>
                      <button
                        onClick={() => handleCopyKey(flag.key)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-slate-300 rounded transition-all"
                        title="Copy flag key"
                      >
                        {copiedKey === flag.key ? (
                          <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <CopyIcon />
                        )}
                      </button>
                    </div>
                    <EnvironmentBadge environment={flag.environment} />
                  </div>
                  {flag.description && (
                    <p className="text-sm text-slate-500 mt-2 line-clamp-2">
                      {flag.description}
                    </p>
                  )}
                </div>

                {/* Right: Controls */}
                <div className="flex items-center gap-6">
                  {/* Toggle */}
                  <div className="flex flex-col items-center gap-1">
                    <Toggle
                      enabled={flag.enabled}
                      onChange={() => handleToggle(flag.id)}
                      disabled={updatingFlags.has(flag.id)}
                    />
                    <span className={`text-xs font-medium ${flag.enabled ? 'text-violet-600' : 'text-slate-400'}`}>
                      {flag.enabled ? 'ON' : 'OFF'}
                    </span>
                  </div>

                  {/* Rollout */}
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-slate-500">Rollout</span>
                    <RolloutSlider
                      value={flag.rolloutPercentage}
                      onChange={(pct) => handleRolloutChange(flag.id, pct)}
                      disabled={updatingFlags.has(flag.id) || !flag.enabled}
                    />
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => handleDeleteClick(flag)}
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors disabled:opacity-50"
                    title="Delete flag"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, flag: null, loading: false })}
        onConfirm={handleDeleteConfirm}
        title="Delete Feature Flag?"
        message={`Are you sure you want to delete "${deleteDialog.flag?.key}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Keep it"
        variant="danger"
        loading={deleteDialog.loading}
      />
    </div>
  );
}
