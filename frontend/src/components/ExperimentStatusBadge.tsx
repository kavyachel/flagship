import type { ExperimentStatus } from '../types/experiment';

interface ExperimentStatusBadgeProps {
  status: ExperimentStatus;
}

const statusConfig: Record<ExperimentStatus, {
  bg: string;
  text: string;
  ring: string;
  icon: string;
  pulse?: boolean;
}> = {
  draft: {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    ring: 'ring-slate-600/20',
    icon: '📝',
  },
  running: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    ring: 'ring-emerald-600/20',
    icon: '▶️',
    pulse: true,
  },
  stopped: {
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    ring: 'ring-slate-600/20',
    icon: '⏹️',
  },
};

export function ExperimentStatusBadge({ status }: ExperimentStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
        ring-1 ring-inset capitalize
        ${config.bg} ${config.text} ${config.ring}
      `}
    >
      <span className={config.pulse ? 'pulse-dot' : ''}>{config.icon}</span>
      {status}
    </span>
  );
}
