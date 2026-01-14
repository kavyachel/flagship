import type { FeatureFlag } from '../types/featureFlag';
import type { Experiment } from '../types/experiment';

interface StatsOverviewProps {
  flags: FeatureFlag[];
  experiments: Experiment[];
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  subtext?: string;
  color: 'violet' | 'emerald' | 'amber' | 'rose' | 'blue';
}

const colorClasses = {
  violet: {
    bg: 'bg-violet-50',
    icon: 'bg-violet-100 text-violet-600',
    text: 'text-violet-600',
  },
  emerald: {
    bg: 'bg-emerald-50',
    icon: 'bg-emerald-100 text-emerald-600',
    text: 'text-emerald-600',
  },
  amber: {
    bg: 'bg-amber-50',
    icon: 'bg-amber-100 text-amber-600',
    text: 'text-amber-600',
  },
  rose: {
    bg: 'bg-rose-50',
    icon: 'bg-rose-100 text-rose-600',
    text: 'text-rose-600',
  },
  blue: {
    bg: 'bg-blue-50',
    icon: 'bg-blue-100 text-blue-600',
    text: 'text-blue-600',
  },
};

function StatCard({ icon, label, value, subtext, color }: StatCardProps) {
  const colors = colorClasses[color];

  return (
    <div className={`${colors.bg} rounded-xl p-4 border border-white/50`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg ${colors.icon} flex items-center justify-center`}>
          {icon}
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
          <p className={`text-2xl font-bold ${colors.text}`}>{value}</p>
          {subtext && <p className="text-xs text-slate-400">{subtext}</p>}
        </div>
      </div>
    </div>
  );
}

export function StatsOverview({ flags, experiments }: StatsOverviewProps) {
  const enabledFlags = flags.filter(f => f.enabled).length;
  const runningExperiments = experiments.filter(e => e.status === 'running').length;

  const envCounts = {
    prod: flags.filter(f => f.environment === 'prod').length,
    staging: flags.filter(f => f.environment === 'staging').length,
    development: flags.filter(f => f.environment === 'development').length,
  };

  const avgRollout = flags.length > 0
    ? Math.round(flags.filter(f => f.enabled).reduce((sum, f) => sum + f.rolloutPercentage, 0) / Math.max(enabledFlags, 1))
    : 0;

  return (
    <div className="mb-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
            </svg>
          }
          label="Total Flags"
          value={flags.length}
          subtext={`${enabledFlags} enabled`}
          color="violet"
        />

        <StatCard
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          label="Active"
          value={enabledFlags}
          subtext={`${avgRollout}% avg rollout`}
          color="emerald"
        />

        <StatCard
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          }
          label="Experiments"
          value={experiments.length}
          subtext={`${runningExperiments} running`}
          color="amber"
        />

        <StatCard
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          label="Environments"
          value={3}
          subtext={`🚀${envCounts.prod} 🧪${envCounts.staging} 🛠️${envCounts.development}`}
          color="blue"
        />
      </div>
    </div>
  );
}
