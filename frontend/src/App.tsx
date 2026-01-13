import { useState } from 'react';
import { Layout, type TabId } from './components/Layout';
import { FlagList } from './components/FlagList';
import { CreateFlagModal } from './components/CreateFlagModal';
import { ExperimentsPage } from './components/ExperimentsPage';
import { useFeatureFlags } from './hooks/useFeatureFlags';

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('flags');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const {
    flags,
    loading,
    error,
    selectedEnvironment,
    setSelectedEnvironment,
    createFlag,
    updateFlag,
    deleteFlag,
    toggleFlag,
  } = useFeatureFlags();

  const handleToggle = async (id: string) => {
    await toggleFlag(id);
  };

  const handleUpdateRollout = async (id: string, percentage: number) => {
    await updateFlag(id, { rolloutPercentage: percentage });
  };

  const handleDelete = async (id: string) => {
    await deleteFlag(id);
  };

  const handleCreate = async (dto: Parameters<typeof createFlag>[0]) => {
    await createFlag(dto);
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'flags' && (
        <>
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Feature Flags</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage feature rollouts and experiments
              </p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              + Create Flag
            </button>
          </div>

          <FlagList
            flags={flags}
            loading={loading}
            error={error}
            onToggle={handleToggle}
            onUpdateRollout={handleUpdateRollout}
            onDelete={handleDelete}
            selectedEnvironment={selectedEnvironment}
            onEnvironmentChange={setSelectedEnvironment}
          />

          <CreateFlagModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onCreate={handleCreate}
          />
        </>
      )}

      {activeTab === 'experiments' && <ExperimentsPage flags={flags} />}
    </Layout>
  );
}

export default App;
