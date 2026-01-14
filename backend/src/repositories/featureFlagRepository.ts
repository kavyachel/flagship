import { pool } from '../db/connection.js';
import {
  FeatureFlag,
  FeatureFlagRow,
  CreateFeatureFlagDTO,
  UpdateFeatureFlagDTO,
  Environment,
  mapRowToFeatureFlag,
} from '../models/featureFlag.js';
import { logger } from '../utils/logger.js';
import { cacheService, CacheKeys } from '../cache/redis.js';

export class FeatureFlagRepository {
  /**
   * Create a new feature flag
   */
  async create(dto: CreateFeatureFlagDTO): Promise<FeatureFlag> {
    const query = `
      INSERT INTO feature_flags (key, description, enabled, rollout_percentage, environment)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [
      dto.key,
      dto.description ?? null,
      dto.enabled ?? false,
      dto.rolloutPercentage ?? 0,
      dto.environment ?? 'development',
    ];

    logger.debug('Creating feature flag', { key: dto.key });

    const result = await pool.query<FeatureFlagRow>(query, values);
    const row = result.rows[0];

    if (!row) {
      throw new Error('Failed to create feature flag');
    }

    return mapRowToFeatureFlag(row);
  }

  /**
   * Find all feature flags, optionally filtered by environment
   */
  async findAll(environment?: Environment): Promise<FeatureFlag[]> {
    let query = 'SELECT * FROM feature_flags';
    const values: Environment[] = [];

    if (environment) {
      query += ' WHERE environment = $1';
      values.push(environment);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query<FeatureFlagRow>(query, values);
    return result.rows.map(mapRowToFeatureFlag);
  }

  /**
   * Find a feature flag by ID
   */
  async findById(id: string): Promise<FeatureFlag | null> {
    const query = 'SELECT * FROM feature_flags WHERE id = $1';
    const result = await pool.query<FeatureFlagRow>(query, [id]);
    const row = result.rows[0];

    return row ? mapRowToFeatureFlag(row) : null;
  }

  /**
   * Find a feature flag by key and environment
   * This is the hot path query for flag evaluation - uses caching
   */
  async findByKey(key: string, environment: Environment): Promise<FeatureFlag | null> {
    const cacheKey = CacheKeys.flag(key, environment);

    // Try cache first
    const cached = await cacheService.get<FeatureFlag>(cacheKey);
    if (cached) {
      logger.debug('Cache hit for flag', { key, environment });
      return cached;
    }

    // Cache miss - query database
    const query = 'SELECT * FROM feature_flags WHERE key = $1 AND environment = $2';
    const result = await pool.query<FeatureFlagRow>(query, [key, environment]);
    const row = result.rows[0];

    if (row) {
      const flag = mapRowToFeatureFlag(row);
      // Cache for subsequent requests
      await cacheService.set(cacheKey, flag);
      return flag;
    }

    return null;
  }

  /**
   * Update a feature flag
   */
  async update(id: string, dto: UpdateFeatureFlagDTO): Promise<FeatureFlag | null> {
    // Build dynamic update query based on provided fields
    const updates: string[] = [];
    const values: (string | boolean | number)[] = [];
    let paramIndex = 1;

    if (dto.key !== undefined) {
      updates.push(`key = $${paramIndex++}`);
      values.push(dto.key);
    }
    if (dto.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(dto.description);
    }
    if (dto.enabled !== undefined) {
      updates.push(`enabled = $${paramIndex++}`);
      values.push(dto.enabled);
    }
    if (dto.rolloutPercentage !== undefined) {
      updates.push(`rollout_percentage = $${paramIndex++}`);
      values.push(dto.rolloutPercentage);
    }
    if (dto.environment !== undefined) {
      updates.push(`environment = $${paramIndex++}`);
      values.push(dto.environment);
    }

    if (updates.length === 0) {
      // Nothing to update, just return the existing flag
      return this.findById(id);
    }

    values.push(id);

    const query = `
      UPDATE feature_flags
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    logger.debug('Updating feature flag', { id, updates: dto });

    const result = await pool.query<FeatureFlagRow>(query, values);
    const row = result.rows[0];

    if (row) {
      const flag = mapRowToFeatureFlag(row);
      // Invalidate cache for this flag
      await cacheService.delete(CacheKeys.flag(flag.key, flag.environment));
      await cacheService.delete(CacheKeys.flagById(flag.id));
      await cacheService.deletePattern('flags:*');
      return flag;
    }

    return null;
  }

  /**
   * Delete a feature flag
   */
  async delete(id: string): Promise<boolean> {
    // Get flag first to invalidate correct cache keys
    const flag = await this.findById(id);

    const query = 'DELETE FROM feature_flags WHERE id = $1';
    const result = await pool.query(query, [id]);

    const deleted = result.rowCount === 1;
    logger.debug('Deleted feature flag', { id, deleted });

    if (deleted && flag) {
      // Invalidate cache
      await cacheService.delete(CacheKeys.flag(flag.key, flag.environment));
      await cacheService.delete(CacheKeys.flagById(flag.id));
      await cacheService.deletePattern('flags:*');
    }

    return deleted;
  }

  /**
   * Check if a flag key already exists
   */
  async existsByKey(key: string): Promise<boolean> {
    const query = 'SELECT 1 FROM feature_flags WHERE key = $1 LIMIT 1';
    const result = await pool.query(query, [key]);

    return result.rowCount !== null && result.rowCount > 0;
  }
}

// Export singleton instance
export const featureFlagRepository = new FeatureFlagRepository();
