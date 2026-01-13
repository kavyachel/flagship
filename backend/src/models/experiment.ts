/**
 * Experiment Model
 *
 * An experiment is attached to a feature flag and defines A/B test variants.
 * When a flag has a running experiment, users are assigned to variants
 * based on deterministic hashing.
 */

export type ExperimentStatus = 'draft' | 'running' | 'stopped';

export interface Experiment {
  id: string;
  flagId: string;
  name: string;
  description: string | null;
  status: ExperimentStatus;
  createdAt: Date;
  updatedAt: Date;
  startedAt: Date | null;
  stoppedAt: Date | null;
}

export interface ExperimentWithVariants extends Experiment {
  variants: Variant[];
}

export interface CreateExperimentDTO {
  flagId: string;
  name: string;
  description?: string;
  variants: CreateVariantDTO[];
}

export interface UpdateExperimentDTO {
  name?: string;
  description?: string;
}

export interface Variant {
  id: string;
  experimentId: string;
  name: string;
  weight: number;
  createdAt: Date;
}

export interface CreateVariantDTO {
  name: string;
  weight: number;
}

/**
 * Database row representations
 */
export interface ExperimentRow {
  id: string;
  flag_id: string;
  name: string;
  description: string | null;
  status: ExperimentStatus;
  created_at: Date;
  updated_at: Date;
  started_at: Date | null;
  stopped_at: Date | null;
}

export interface VariantRow {
  id: string;
  experiment_id: string;
  name: string;
  weight: number;
  created_at: Date;
}

export function mapRowToExperiment(row: ExperimentRow): Experiment {
  return {
    id: row.id,
    flagId: row.flag_id,
    name: row.name,
    description: row.description,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    startedAt: row.started_at,
    stoppedAt: row.stopped_at,
  };
}

export function mapRowToVariant(row: VariantRow): Variant {
  return {
    id: row.id,
    experimentId: row.experiment_id,
    name: row.name,
    weight: row.weight,
    createdAt: row.created_at,
  };
}
