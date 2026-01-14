import { useState, useEffect } from 'react';
import { Layout, type TabId } from './components/Layout';
import { FlagList } from './components/FlagList';
import { CreateFlagModal } from './components/CreateFlagModal';
import { ExperimentsPage } from './components/ExperimentsPage';
import { StatsOverview } from './components/StatsOverview';
import { useFeatureFlags } from './hooks/useFeatureFlags';
import { useExperiments } from './hooks/useExperiments';
import { useToast } from './components/Toast';

// Icons
const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

const KeyboardIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
  </svg>
);

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('flags');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const toast = useToast();

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

  const { experiments } = useExperiments();

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // 'n' to create new flag
      if (e.key === 'n' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setIsCreateModalOpen(true);
      }

      // '1' for flags tab, '2' for experiments tab
      if (e.key === '1') {
        setActiveTab('flags');
      }
      if (e.key === '2') {
        setActiveTab('experiments');
      }

      // '?' to show keyboard shortcuts
      if (e.key === '?') {
        toast.info('Keyboard Shortcuts', 'n = New flag, 1 = Flags, 2 = Experiments');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toast]);

  const handleToggle = async (id: string) => {
    const flag = flags.find(f => f.id === id);
    await toggleFlag(id);
    if (flag) {
      toast.success(
        flag.enabled ? 'Flag Disabled' : 'Flag Enabled',
        `${flag.key} is now ${flag.enabled ? 'off' : 'on'}`
      );
    }
  };

  const handleUpdateRollout = async (id: string, percentage: number) => {
    const flag = flags.find(f => f.id === id);
    await updateFlag(id, { rolloutPercentage: percentage });
    if (flag) {
      toast.success('Rollout Updated', `${flag.key} now at ${percentage}%`);
    }
  };

  const handleDelete = async (id: string) => {
    const flag = flags.find(f => f.id === id);
    await deleteFlag(id);
    if (flag) {
      toast.success('Flag Deleted', `${flag.key} has been removed`);
    }
  };

  const handleCreate = async (dto: Parameters<typeof createFlag>[0]) => {
    await createFlag(dto);
    toast.success('Flag Created', `${dto.key} is ready to use`);
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'flags' && (
        <>
          <div className="mb-6 flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Feature Flags</h1>
              <p className="mt-1 text-slate-500">
                Control feature rollouts and manage experiments across environments
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-1.5 px-3 py-2 text-xs text-slate-400 bg-slate-100 rounded-lg">
                <KeyboardIcon />
                <span>Press <kbd className="px-1.5 py-0.5 bg-white rounded text-slate-600 font-mono">n</kbd> to create</span>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="btn-gradient inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
              >
                <PlusIcon />
                Create Flag
              </button>
            </div>
          </div>

          {/* Stats Overview */}
          <StatsOverview flags={flags} experiments={experiments} />

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
