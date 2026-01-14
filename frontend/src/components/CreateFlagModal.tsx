import { useState } from 'react';
import type { CreateFeatureFlagDTO, Environment } from '../types/featureFlag';

interface CreateFlagModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (dto: CreateFeatureFlagDTO) => Promise<void>;
}

const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export function CreateFlagModal({ isOpen, onClose, onCreate }: CreateFlagModalProps) {
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [environment, setEnvironment] = useState<Environment>('development');
  const [enabled, setEnabled] = useState(false);
  const [rolloutPercentage, setRolloutPercentage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await onCreate({
        key,
        description: description || undefined,
        environment,
        enabled,
        rolloutPercentage,
      });
      // Reset form
      setKey('');
      setDescription('');
      setEnvironment('development');
      setEnabled(false);
      setRolloutPercentage(0);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create flag');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
          {/* Header */}
          <div className="header-gradient px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">
                ✨ Create Feature Flag
              </h2>
              <p className="text-sm text-white/70">Add a new flag to control feature rollouts</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <CloseIcon />
            </button>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-4 bg-rose-50 border border-rose-200 rounded-lg p-3 flex items-center gap-2">
                <span>⚠️</span>
                <p className="text-sm text-rose-800">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="key" className="block text-sm font-medium text-slate-700 mb-1">
                  Flag Key <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  id="key"
                  value={key}
                  onChange={(e) => setKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                  placeholder="e.g., checkout_redesign"
                  required
                  pattern="[a-z][a-z0-9_]{2,99}"
                  title="Lowercase letters, numbers, and underscores. 3-100 characters."
                  className="block w-full rounded-lg border border-slate-200 px-3 py-2.5 shadow-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 font-mono text-sm transition-all"
                />
                <p className="mt-1.5 text-xs text-slate-500">
                  💡 Lowercase letters, numbers, and underscores only
                </p>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What does this flag control?"
                  rows={2}
                  className="block w-full rounded-lg border border-slate-200 px-3 py-2.5 shadow-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 text-sm transition-all resize-none"
                />
              </div>

              <div>
                <label htmlFor="environment" className="block text-sm font-medium text-slate-700 mb-1">
                  Environment
                </label>
                <select
                  id="environment"
                  value={environment}
                  onChange={(e) => setEnvironment(e.target.value as Environment)}
                  className="block w-full rounded-lg border border-slate-200 px-3 py-2.5 shadow-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 text-sm transition-all"
                >
                  <option value="development">🛠️ Development</option>
                  <option value="staging">🧪 Staging</option>
                  <option value="prod">🚀 Production</option>
                </select>
              </div>

              <div className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg">
                <label htmlFor="enabled" className="text-sm font-medium text-slate-700">
                  Enable on creation
                </label>
                <button
                  type="button"
                  onClick={() => setEnabled(!enabled)}
                  className={`
                    relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full
                    border-2 border-transparent transition-colors duration-200 ease-in-out
                    focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2
                    ${enabled
                      ? 'bg-gradient-to-r from-violet-500 to-purple-500 shadow-md shadow-violet-500/30'
                      : 'bg-slate-200'
                    }
                  `}
                >
                  <span
                    className={`
                      pointer-events-none inline-block h-6 w-6 transform rounded-full
                      bg-white shadow-lg ring-0 transition duration-200 ease-in-out
                      ${enabled ? 'translate-x-5' : 'translate-x-0'}
                    `}
                  />
                </button>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="rollout" className="text-sm font-medium text-slate-700">
                    Rollout Percentage
                  </label>
                  <span className="text-sm font-semibold text-violet-600">{rolloutPercentage}%</span>
                </div>
                <input
                  type="range"
                  id="rollout"
                  min="0"
                  max="100"
                  value={rolloutPercentage}
                  onChange={(e) => setRolloutPercentage(parseInt(e.target.value, 10))}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #8b5cf6 0%, #a855f7 ${rolloutPercentage}%, #e2e8f0 ${rolloutPercentage}%, #e2e8f0 100%)`
                  }}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-gradient px-5 py-2.5 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 disabled:opacity-50 transition-all"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Creating...
                    </span>
                  ) : (
                    'Create Flag'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
