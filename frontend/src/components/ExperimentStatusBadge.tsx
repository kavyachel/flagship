import type { ExperimentStatus } from '../types/experiment';

interface ExperimentStatusBadgeProps {
  status: ExperimentStatus;
}

const statusStyles: Record<ExperimentStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  running: 'bg-green-100 text-green-800',
  stopped: 'bg-red-100 text-red-800',
};

const statusLabels: Record<ExperimentStatus, string> = {
  draft: 'Draft',
  running: 'Running',
  stopped: 'Stopped',
};

export function ExperimentStatusBadge({ status }: ExperimentStatusBadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
        ${statusStyles[status]}
      `}
    >
      {status === 'running' && (
        <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5 animate-pulse" />
      )}
      {statusLabels[status]}
    </span>
  );
}
