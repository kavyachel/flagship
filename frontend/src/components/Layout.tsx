import type { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
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
                <a
                  href="/"
                  className="text-gray-900 hover:text-indigo-600 px-3 py-2 text-sm font-medium"
                >
                  Feature Flags
                </a>
                <span className="text-gray-400 px-3 py-2 text-sm font-medium cursor-not-allowed">
                  Experiments (Coming Soon)
                </span>
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
