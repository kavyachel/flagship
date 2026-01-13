export type ExperimentStatus = 'draft' | 'running' | 'stopped';

export interface Variant {
  id: string;
  experimentId: string;
  name: string;
  weight: number;
  createdAt: string;
}

export interface Experiment {
  id: string;
  flagId: string;
  name: string;
  description: string | null;
  status: ExperimentStatus;
  variants: Variant[];
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  stoppedAt: string | null;
}

export interface CreateExperimentDTO {
  flagId: string;
  name: string;
  description?: string;
  variants: Array<{ name: string; weight: number }>;
}

export interface VariantMetrics {
  variantId: string;
  variantName: string;
  weight: number;
  totalEvents: number;
  uniqueUsers: number;
  conversionRate: number;
  averageValue: number | null;
}

export interface ExperimentMetrics {
  experimentId: string;
  experimentName: string;
  totalEvents: number;
  uniqueUsers: number;
  variantMetrics: VariantMetrics[];
}
