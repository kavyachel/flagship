import type { ReactNode } from 'react';

export type TabId = 'flags' | 'experiments';

interface LayoutProps {
  children: ReactNode;
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function Layout({ children, activeTab, onTabChange }: LayoutProps) {
  const getTabClass = (tab: TabId) => {
    const base = 'px-3 py-2 text-sm font-medium cursor-pointer';
    if (tab === activeTab) {
      return `${base} text-indigo-600 border-b-2 border-indigo-600`;
    }
    return `${base} text-gray-500 hover:text-gray-900`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-xl font-bold text-indigo-600">Flagship</span>
              </div>
              <div className="ml-6 flex space-x-4">
                <button
                  onClick={() => onTabChange('flags')}
                  className={getTabClass('flags')}
                >
                  Feature Flags
                </button>
                <button
                  onClick={() => onTabChange('experiments')}
                  className={getTabClass('experiments')}
                >
                  Experiments
                </button>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-500">v1.0.0</span>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
