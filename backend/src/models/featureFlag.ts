/**
 * Feature Flag Model
 *
 * Represents a feature flag that can be used to control feature rollouts
 * and enable/disable functionality for specific user segments.
 */

export type Environment = 'prod' | 'staging' | 'development';

export interface FeatureFlag {
  id: string;
  key: string;
  description: string | null;
  enabled: boolean;
  rolloutPercentage: number;
  environment: Environment;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFeatureFlagDTO {
  key: string;
  description?: string;
  enabled?: boolean;
  rolloutPercentage?: number;
  environment?: Environment;
}

export interface UpdateFeatureFlagDTO {
  key?: string;
  description?: string;
  enabled?: boolean;
  rolloutPercentage?: number;
  environment?: Environment;
}

/**
 * Database row representation (snake_case from PostgreSQL)
 */
export interface FeatureFlagRow {
  id: string;
  key: string;
  description: string | null;
  enabled: boolean;
  rollout_percentage: number;
  environment: Environment;
  created_at: Date;
  updated_at: Date;
}

/**
 * Maps a database row to the application model
 */
export function mapRowToFeatureFlag(row: FeatureFlagRow): FeatureFlag {
  return {
    id: row.id,
    key: row.key,
    description: row.description,
    enabled: row.enabled,
    rolloutPercentage: row.rollout_percentage,
    environment: row.environment,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
