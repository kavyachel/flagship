import type { Environment } from '../types/featureFlag';

interface EnvironmentBadgeProps {
  environment: Environment;
}

// Environment configuration with colors and icons
const environmentConfig: Record<Environment, {
  bg: string;
  text: string;
  icon: string;
  ring: string;
}> = {
  prod: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    ring: 'ring-rose-600/20',
    icon: '🚀',
  },
  staging: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    ring: 'ring-amber-600/20',
    icon: '🧪',
  },
  development: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    ring: 'ring-emerald-600/20',
    icon: '🛠️',
  },
};

export function EnvironmentBadge({ environment }: EnvironmentBadgeProps) {
  const config = environmentConfig[environment];

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
        ring-1 ring-inset
        ${config.bg} ${config.text} ${config.ring}
      `}
    >
      <span className="text-sm">{config.icon}</span>
      {environment}
    </span>
  );
}
