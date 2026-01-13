import { Request, Response, NextFunction } from 'express';
import { featureFlagService } from '../services/featureFlagService.js';
import { CreateFeatureFlagDTO, UpdateFeatureFlagDTO, Environment } from '../models/featureFlag.js';
import { ValidationError } from '../middleware/errorHandler.js';

/**
 * Create a new feature flag
 * POST /api/v1/flags
 */
export async function createFlag(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const dto: CreateFeatureFlagDTO = {
      key: req.body.key as string,
      description: req.body.description as string | undefined,
      enabled: req.body.enabled as boolean | undefined,
      rolloutPercentage: req.body.rolloutPercentage as number | undefined,
      environment: req.body.environment as Environment | undefined,
    };

    if (!dto.key) {
      throw new ValidationError('Flag key is required');
    }

    const flag = await featureFlagService.createFlag(dto);

    res.status(201).json({
      success: true,
      data: flag,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all feature flags
 * GET /api/v1/flags
 * Query params: environment (optional)
 */
export async function getAllFlags(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const environment = req.query.environment as Environment | undefined;

    // Validate environment if provided
    if (environment && !['prod', 'staging', 'development'].includes(environment)) {
      throw new ValidationError('Invalid environment. Must be: prod, staging, or development');
    }

    const flags = await featureFlagService.getAllFlags(environment);

    res.json({
      success: true,
      data: flags,
      count: flags.length,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get a feature flag by ID
 * GET /api/v1/flags/:id
 */
export async function getFlagById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    if (!id) {
      throw new ValidationError('Flag ID is required');
    }

    const flag = await featureFlagService.getFlagById(id);

    res.json({
      success: true,
      data: flag,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update a feature flag
 * PUT /api/v1/flags/:id
 */
export async function updateFlag(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    if (!id) {
      throw new ValidationError('Flag ID is required');
    }

    const dto: UpdateFeatureFlagDTO = {};

    // Only include fields that are explicitly provided
    if (req.body.key !== undefined) dto.key = req.body.key as string;
    if (req.body.description !== undefined) dto.description = req.body.description as string;
    if (req.body.enabled !== undefined) dto.enabled = req.body.enabled as boolean;
    if (req.body.rolloutPercentage !== undefined) {
      dto.rolloutPercentage = req.body.rolloutPercentage as number;
    }
    if (req.body.environment !== undefined) dto.environment = req.body.environment as Environment;

    const flag = await featureFlagService.updateFlag(id, dto);

    res.json({
      success: true,
      data: flag,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a feature flag
 * DELETE /api/v1/flags/:id
 */
export async function deleteFlag(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    if (!id) {
      throw new ValidationError('Flag ID is required');
    }

    await featureFlagService.deleteFlag(id);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

/**
 * Toggle a feature flag's enabled state
 * POST /api/v1/flags/:id/toggle
 */
export async function toggleFlag(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    if (!id) {
      throw new ValidationError('Flag ID is required');
    }

    const flag = await featureFlagService.toggleFlag(id);

    res.json({
      success: true,
      data: flag,
    });
  } catch (error) {
    next(error);
  }
}
