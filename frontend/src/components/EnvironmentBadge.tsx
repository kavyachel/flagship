import type { Environment } from '../types/featureFlag';

interface EnvironmentBadgeProps {
  environment: Environment;
}

const environmentStyles: Record<Environment, string> = {
  prod: 'bg-red-100 text-red-800',
  staging: 'bg-yellow-100 text-yellow-800',
  development: 'bg-green-100 text-green-800',
};

export function EnvironmentBadge({ environment }: EnvironmentBadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
        ${environmentStyles[environment]}
      `}
    >
      {environment}
    </span>
  );
}
