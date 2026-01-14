import type { ReactNode } from 'react';

export type TabId = 'flags' | 'experiments';

interface LayoutProps {
  children: ReactNode;
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

// Icons as inline SVGs for zero dependencies
const FlagIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
  </svg>
);

const BeakerIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
  </svg>
);

const ToggleIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
  </svg>
);

const SparklesIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.5 18l-.375 1.5-.375-1.5a2.25 2.25 0 00-1.635-1.635L12 16.5l1.5-.375a2.25 2.25 0 001.635-1.635L15.75 12.75l.375 1.5a2.25 2.25 0 001.635 1.635l1.5.375-1.5.375a2.25 2.25 0 00-1.635 1.635z" />
  </svg>
);

export function Layout({ children, activeTab, onTabChange }: LayoutProps) {
  const getTabClass = (tab: TabId) => {
    const base = 'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg cursor-pointer transition-all duration-200';
    if (tab === activeTab) {
      return `${base} bg-white/20 text-white`;
    }
    return `${base} text-white/70 hover:text-white hover:bg-white/10`;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Gradient Header */}
      <nav className="header-gradient shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              {/* Logo */}
              <div className="flex-shrink-0 flex items-center">
                <div className="p-2 bg-white/20 rounded-xl">
                  <FlagIcon />
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="ml-8 flex items-center space-x-2">
                <button
                  onClick={() => onTabChange('flags')}
                  className={getTabClass('flags')}
                >
                  <ToggleIcon />
                  Feature Flags
                </button>
                <button
                  onClick={() => onTabChange('experiments')}
                  className={getTabClass('experiments')}
                >
                  <BeakerIcon />
                  Experiments
                </button>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-full text-white/80 text-sm">
                <SparklesIcon />
                <span>v1.0.0</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
