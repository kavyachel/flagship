import { Request, Response, NextFunction } from 'express';
import { evaluationService } from '../services/evaluationService.js';
import { Environment } from '../models/featureFlag.js';
import { ValidationError } from '../middleware/errorHandler.js';

const VALID_ENVIRONMENTS = ['prod', 'staging', 'development'];

/**
 * Evaluate a single feature flag
 * GET /api/v1/evaluate?flagKey=xxx&userId=xxx&environment=xxx
 *
 * This is the HOT PATH - optimized for speed.
 */
export async function evaluateFlag(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const flagKey = req.query.flagKey as string;
    const userId = req.query.userId as string;
    const environment = (req.query.environment as Environment) ?? 'development';

    // Validate required parameters
    if (!flagKey) {
      throw new ValidationError('flagKey query parameter is required');
    }
    if (!userId) {
      throw new ValidationError('userId query parameter is required');
    }
    if (!VALID_ENVIRONMENTS.includes(environment)) {
      throw new ValidationError(
        `Invalid environment. Must be one of: ${VALID_ENVIRONMENTS.join(', ')}`
      );
    }

    const result = await evaluationService.evaluate({
      flagKey,
      userId,
      environment,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * Evaluate multiple flags at once
 * POST /api/v1/evaluate/batch
 * Body: { flagKeys: [...], userId: "xxx", environment: "xxx" }
 */
export async function evaluateBatch(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const flagKeys = req.body.flagKeys as string[];
    const userId = req.body.userId as string;
    const environment = (req.body.environment as Environment) ?? 'development';

    // Validate required parameters
    if (!flagKeys || !Array.isArray(flagKeys) || flagKeys.length === 0) {
      throw new ValidationError('flagKeys must be a non-empty array');
    }
    if (flagKeys.length > 100) {
      throw new ValidationError('Cannot evaluate more than 100 flags at once');
    }
    if (!userId) {
      throw new ValidationError('userId is required');
    }
    if (!VALID_ENVIRONMENTS.includes(environment)) {
      throw new ValidationError(
        `Invalid environment. Must be one of: ${VALID_ENVIRONMENTS.join(', ')}`
      );
    }

    const results = await evaluationService.evaluateBatch(flagKeys, userId, environment);

    res.json({
      success: true,
      data: results,
      count: results.length,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Evaluate all flags for a user
 * GET /api/v1/evaluate/all?userId=xxx&environment=xxx
 */
export async function evaluateAll(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.query.userId as string;
    const environment = (req.query.environment as Environment) ?? 'development';

    if (!userId) {
      throw new ValidationError('userId query parameter is required');
    }
    if (!VALID_ENVIRONMENTS.includes(environment)) {
      throw new ValidationError(
        `Invalid environment. Must be one of: ${VALID_ENVIRONMENTS.join(', ')}`
      );
    }

    const results = await evaluationService.evaluateAll(userId, environment);

    res.json({
      success: true,
      data: results,
      count: Object.keys(results).length,
    });
  } catch (error) {
    next(error);
  }
}
