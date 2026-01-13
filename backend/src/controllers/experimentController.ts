import { Request, Response, NextFunction } from 'express';
import { experimentService } from '../services/experimentService.js';
import { CreateExperimentDTO, UpdateExperimentDTO } from '../models/experiment.js';
import { ValidationError } from '../middleware/errorHandler.js';

/**
 * Create a new experiment
 * POST /api/v1/experiments
 */
export async function createExperiment(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const dto: CreateExperimentDTO = {
      flagId: req.body.flagId as string,
      name: req.body.name as string,
      description: req.body.description as string | undefined,
      variants: req.body.variants as Array<{ name: string; weight: number }>,
    };

    if (!dto.flagId) {
      throw new ValidationError('flagId is required');
    }
    if (!dto.name) {
      throw new ValidationError('name is required');
    }
    if (!dto.variants || !Array.isArray(dto.variants)) {
      throw new ValidationError('variants must be an array');
    }

    const experiment = await experimentService.createExperiment(dto);

    res.status(201).json({
      success: true,
      data: experiment,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all experiments
 * GET /api/v1/experiments
 * Query params: flagId (optional)
 */
export async function getAllExperiments(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const flagId = req.query.flagId as string | undefined;
    const experiments = await experimentService.getAllExperiments(flagId);

    res.json({
      success: true,
      data: experiments,
      count: experiments.length,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get an experiment by ID
 * GET /api/v1/experiments/:id
 */
export async function getExperimentById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    if (!id) {
      throw new ValidationError('Experiment ID is required');
    }

    const experiment = await experimentService.getExperimentById(id);

    res.json({
      success: true,
      data: experiment,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update an experiment
 * PUT /api/v1/experiments/:id
 */
export async function updateExperiment(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    if (!id) {
      throw new ValidationError('Experiment ID is required');
    }

    const dto: UpdateExperimentDTO = {};
    if (req.body.name !== undefined) dto.name = req.body.name as string;
    if (req.body.description !== undefined) dto.description = req.body.description as string;

    const experiment = await experimentService.updateExperiment(id, dto);

    res.json({
      success: true,
      data: experiment,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Start an experiment
 * POST /api/v1/experiments/:id/start
 */
export async function startExperiment(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    if (!id) {
      throw new ValidationError('Experiment ID is required');
    }

    const experiment = await experimentService.startExperiment(id);

    res.json({
      success: true,
      data: experiment,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Stop an experiment
 * POST /api/v1/experiments/:id/stop
 */
export async function stopExperiment(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    if (!id) {
      throw new ValidationError('Experiment ID is required');
    }

    const experiment = await experimentService.stopExperiment(id);

    res.json({
      success: true,
      data: experiment,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete an experiment
 * DELETE /api/v1/experiments/:id
 */
export async function deleteExperiment(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    if (!id) {
      throw new ValidationError('Experiment ID is required');
    }

    await experimentService.deleteExperiment(id);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

/**
 * Update variant weights
 * PUT /api/v1/experiments/:id/variants
 */
export async function updateVariantWeights(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    if (!id) {
      throw new ValidationError('Experiment ID is required');
    }

    const variants = req.body.variants as Array<{ id: string; weight: number }>;

    if (!variants || !Array.isArray(variants)) {
      throw new ValidationError('variants must be an array');
    }

    const experiment = await experimentService.updateVariantWeights(id, variants);

    res.json({
      success: true,
      data: experiment,
    });
  } catch (error) {
    next(error);
  }
}
