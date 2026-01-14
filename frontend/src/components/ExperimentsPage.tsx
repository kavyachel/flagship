import { useState } from 'react';
import { ExperimentList } from './ExperimentList';
import { CreateExperimentModal } from './CreateExperimentModal';
import { useExperiments } from '../hooks/useExperiments';
import type { FeatureFlag } from '../types/featureFlag';

interface ExperimentsPageProps {
  flags: FeatureFlag[];
}

// Icons
const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);


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
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Experiments</h1>
          <p className="mt-1 text-slate-500">
            Run A/B tests with deterministic variant assignment and track conversion metrics
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="btn-gradient inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
        >
          <PlusIcon />
          Create Experiment
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
