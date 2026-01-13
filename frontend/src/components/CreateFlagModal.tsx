import { useState } from 'react';
import type { CreateFeatureFlagDTO, Environment } from '../types/featureFlag';

interface CreateFlagModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (dto: CreateFeatureFlagDTO) => Promise<void>;
}

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
          className="fixed inset-0 bg-black bg-opacity-25 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Create Feature Flag
          </h2>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="key" className="block text-sm font-medium text-gray-700">
                Flag Key *
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
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 font-mono text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">
                Lowercase letters, numbers, and underscores only
              </p>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What does this flag control?"
                rows={2}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
              />
            </div>

            <div>
              <label htmlFor="environment" className="block text-sm font-medium text-gray-700">
                Environment
              </label>
              <select
                id="environment"
                value={environment}
                onChange={(e) => setEnvironment(e.target.value as Environment)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
              >
                <option value="development">Development</option>
                <option value="staging">Staging</option>
                <option value="prod">Production</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <label htmlFor="enabled" className="text-sm font-medium text-gray-700">
                Enabled
              </label>
              <button
                type="button"
                onClick={() => setEnabled(!enabled)}
                className={`
                  relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full
                  border-2 border-transparent transition-colors duration-200 ease-in-out
                  focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2
                  ${enabled ? 'bg-indigo-600' : 'bg-gray-200'}
                `}
              >
                <span
                  className={`
                    pointer-events-none inline-block h-5 w-5 transform rounded-full
                    bg-white shadow ring-0 transition duration-200 ease-in-out
                    ${enabled ? 'translate-x-5' : 'translate-x-0'}
                  `}
                />
              </button>
            </div>

            <div>
              <label htmlFor="rollout" className="block text-sm font-medium text-gray-700">
                Rollout Percentage: {rolloutPercentage}%
              </label>
              <input
                type="range"
                id="rollout"
                min="0"
                max="100"
                value={rolloutPercentage}
                onChange={(e) => setRolloutPercentage(parseInt(e.target.value, 10))}
                className="mt-2 w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Flag'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
