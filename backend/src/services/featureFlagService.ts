import {
  FeatureFlag,
  CreateFeatureFlagDTO,
  UpdateFeatureFlagDTO,
  Environment,
} from '../models/featureFlag.js';
import { featureFlagRepository } from '../repositories/featureFlagRepository.js';
import { NotFoundError, ValidationError, ConflictError } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';

export class FeatureFlagService {
  /**
   * Create a new feature flag
   */
  async createFlag(dto: CreateFeatureFlagDTO): Promise<FeatureFlag> {
    // Validate key format (alphanumeric with underscores, lowercase)
    if (!this.isValidFlagKey(dto.key)) {
      throw new ValidationError(
        'Flag key must be lowercase alphanumeric with underscores, 3-100 characters'
      );
    }

    // Validate rollout percentage
    if (dto.rolloutPercentage !== undefined) {
      if (dto.rolloutPercentage < 0 || dto.rolloutPercentage > 100) {
        throw new ValidationError('Rollout percentage must be between 0 and 100');
      }
    }

    // Check for duplicate key
    const exists = await featureFlagRepository.existsByKey(dto.key);
    if (exists) {
      throw new ConflictError(`Feature flag with key '${dto.key}' already exists`);
    }

    logger.info('Creating feature flag', { key: dto.key });
    return featureFlagRepository.create(dto);
  }

  /**
   * Get all feature flags
   */
  async getAllFlags(environment?: Environment): Promise<FeatureFlag[]> {
    return featureFlagRepository.findAll(environment);
  }

  /**
   * Get a feature flag by ID
   */
  async getFlagById(id: string): Promise<FeatureFlag> {
    const flag = await featureFlagRepository.findById(id);

    if (!flag) {
      throw new NotFoundError(`Feature flag with ID '${id}' not found`);
    }

    return flag;
  }

  /**
   * Get a feature flag by key and environment
   */
  async getFlagByKey(key: string, environment: Environment): Promise<FeatureFlag | null> {
    return featureFlagRepository.findByKey(key, environment);
  }

  /**
   * Update a feature flag
   */
  async updateFlag(id: string, dto: UpdateFeatureFlagDTO): Promise<FeatureFlag> {
    // Validate key format if provided
    if (dto.key !== undefined && !this.isValidFlagKey(dto.key)) {
      throw new ValidationError(
        'Flag key must be lowercase alphanumeric with underscores, 3-100 characters'
      );
    }

    // Validate rollout percentage if provided
    if (dto.rolloutPercentage !== undefined) {
      if (dto.rolloutPercentage < 0 || dto.rolloutPercentage > 100) {
        throw new ValidationError('Rollout percentage must be between 0 and 100');
      }
    }

    // Check if flag exists
    const existingFlag = await featureFlagRepository.findById(id);
    if (!existingFlag) {
      throw new NotFoundError(`Feature flag with ID '${id}' not found`);
    }

    // Check for key conflict if changing key
    if (dto.key !== undefined && dto.key !== existingFlag.key) {
      const keyExists = await featureFlagRepository.existsByKey(dto.key);
      if (keyExists) {
        throw new ConflictError(`Feature flag with key '${dto.key}' already exists`);
      }
    }

    logger.info('Updating feature flag', { id, updates: dto });

    const updated = await featureFlagRepository.update(id, dto);
    if (!updated) {
      throw new Error('Failed to update feature flag');
    }

    return updated;
  }

  /**
   * Delete a feature flag
   */
  async deleteFlag(id: string): Promise<void> {
    const exists = await featureFlagRepository.findById(id);
    if (!exists) {
      throw new NotFoundError(`Feature flag with ID '${id}' not found`);
    }

    logger.info('Deleting feature flag', { id, key: exists.key });

    const deleted = await featureFlagRepository.delete(id);
    if (!deleted) {
      throw new Error('Failed to delete feature flag');
    }
  }

  /**
   * Toggle a feature flag's enabled state
   */
  async toggleFlag(id: string): Promise<FeatureFlag> {
    const flag = await featureFlagRepository.findById(id);
    if (!flag) {
      throw new NotFoundError(`Feature flag with ID '${id}' not found`);
    }

    logger.info('Toggling feature flag', { id, key: flag.key, newState: !flag.enabled });

    const updated = await featureFlagRepository.update(id, { enabled: !flag.enabled });
    if (!updated) {
      throw new Error('Failed to toggle feature flag');
    }

    return updated;
  }

  /**
   * Validate flag key format
   * Must be lowercase alphanumeric with underscores, 3-100 characters
   */
  private isValidFlagKey(key: string): boolean {
    const keyRegex = /^[a-z][a-z0-9_]{2,99}$/;
    return keyRegex.test(key);
  }
}

// Export singleton instance
export const featureFlagService = new FeatureFlagService();
