import { useState } from 'react';
import { ExperimentList } from './ExperimentList';
import { CreateExperimentModal } from './CreateExperimentModal';
import { useExperiments } from '../hooks/useExperiments';
import type { FeatureFlag } from '../types/featureFlag';

interface ExperimentsPageProps {
  flags: FeatureFlag[];
}

export function ExperimentsPage({ flags }: ExperimentsPageProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const {
    experiments,
    loading,
    error,
    createExperiment,
    startExperiment,
    stopExperiment,
    deleteExperiment,
    getMetrics,
  } = useExperiments();

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Experiments</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create and manage A/B tests with variant assignment
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          + Create Experiment
        </button>
      </div>

      <ExperimentList
        experiments={experiments}
        flags={flags}
        loading={loading}
        error={error}
        onStart={startExperiment}
        onStop={stopExperiment}
        onDelete={deleteExperiment}
        onGetMetrics={getMetrics}
      />

      <CreateExperimentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={createExperiment}
        flags={flags}
      />
    </div>
  );
}
