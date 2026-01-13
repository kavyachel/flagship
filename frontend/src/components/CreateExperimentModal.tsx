import { useState } from 'react';
import type { CreateExperimentDTO } from '../types/experiment';
import type { FeatureFlag } from '../types/featureFlag';

interface CreateExperimentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (dto: CreateExperimentDTO) => Promise<unknown>;
  flags: FeatureFlag[];
}

interface VariantInput {
  name: string;
  weight: number;
}

export function CreateExperimentModal({
  isOpen,
  onClose,
  onCreate,
  flags,
}: CreateExperimentModalProps) {
  const [flagId, setFlagId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [variants, setVariants] = useState<VariantInput[]>([
    { name: 'control', weight: 50 },
    { name: 'treatment', weight: 50 },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);

  const handleAddVariant = () => {
    setVariants([...variants, { name: '', weight: 0 }]);
  };

  const handleRemoveVariant = (index: number) => {
    if (variants.length <= 2) return;
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleVariantChange = (index: number, field: keyof VariantInput, value: string | number) => {
    const updated = [...variants];
    const variant = updated[index];
    if (variant) {
      if (field === 'weight') {
        variant[field] = Math.max(0, Math.min(100, Number(value)));
      } else {
        variant[field] = value as string;
      }
    }
    setVariants(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (totalWeight !== 100) {
      setError(`Variant weights must sum to 100 (currently ${totalWeight})`);
      return;
    }

    const emptyVariant = variants.find((v) => !v.name.trim());
    if (emptyVariant) {
      setError('All variants must have a name');
      return;
    }

    setLoading(true);
    try {
      await onCreate({
        flagId,
        name,
        description: description || undefined,
        variants: variants.map((v) => ({ name: v.name.trim(), weight: v.weight })),
      });
      // Reset form
      setFlagId('');
      setName('');
      setDescription('');
      setVariants([
        { name: 'control', weight: 50 },
        { name: 'treatment', weight: 50 },
      ]);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create experiment');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const enabledFlags = flags.filter((f) => f.enabled);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black bg-opacity-25 transition-opacity"
          onClick={onClose}
        />

        <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Create Experiment
          </h2>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="flagId" className="block text-sm font-medium text-gray-700">
                Feature Flag *
              </label>
              <select
                id="flagId"
                value={flagId}
                onChange={(e) => setFlagId(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
              >
                <option value="">Select a flag...</option>
                {enabledFlags.map((flag) => (
                  <option key={flag.id} value={flag.id}>
                    {flag.key} ({flag.environment})
                  </option>
                ))}
              </select>
              {enabledFlags.length === 0 && (
                <p className="mt-1 text-xs text-amber-600">
                  No enabled flags available. Enable a flag first.
                </p>
              )}
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Experiment Name *
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Checkout Button Color Test"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What hypothesis are you testing?"
                rows={2}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Variants *
                </label>
                <span
                  className={`text-xs font-medium ${
                    totalWeight === 100 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  Total: {totalWeight}%
                </span>
              </div>

              <div className="space-y-2">
                {variants.map((variant, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={variant.name}
                      onChange={(e) => handleVariantChange(index, 'name', e.target.value)}
                      placeholder="Variant name"
                      className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                    />
                    <div className="flex items-center space-x-1">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={variant.weight}
                        onChange={(e) => handleVariantChange(index, 'weight', e.target.value)}
                        className="w-16 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                      />
                      <span className="text-sm text-gray-500">%</span>
                    </div>
                    {variants.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveVariant(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleAddVariant}
                className="mt-2 text-sm text-indigo-600 hover:text-indigo-700"
              >
                + Add variant
              </button>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || totalWeight !== 100}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Experiment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
