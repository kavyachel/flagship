import {
  Experiment,
  ExperimentWithVariants,
  CreateExperimentDTO,
  UpdateExperimentDTO,
  ExperimentStatus,
} from '../models/experiment.js';
import { experimentRepository } from '../repositories/experimentRepository.js';
import { featureFlagRepository } from '../repositories/featureFlagRepository.js';
import { NotFoundError, ValidationError, ConflictError } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';

export class ExperimentService {
  /**
   * Create a new experiment with variants
   */
  async createExperiment(dto: CreateExperimentDTO): Promise<ExperimentWithVariants> {
    // Validate flag exists
    const flag = await featureFlagRepository.findById(dto.flagId);
    if (!flag) {
      throw new NotFoundError(`Feature flag with ID '${dto.flagId}' not found`);
    }

    // Validate variants
    if (!dto.variants || dto.variants.length < 2) {
      throw new ValidationError('Experiment must have at least 2 variants');
    }

    // Validate variant weights sum to 100
    const totalWeight = dto.variants.reduce((sum, v) => sum + v.weight, 0);
    if (totalWeight !== 100) {
      throw new ValidationError(
        `Variant weights must sum to 100, got ${totalWeight}`
      );
    }

    // Check for duplicate variant names
    const names = dto.variants.map((v) => v.name);
    if (new Set(names).size !== names.length) {
      throw new ValidationError('Variant names must be unique');
    }

    // Check if flag already has a running experiment
    const existingRunning = await experimentRepository.findRunningByFlagId(dto.flagId);
    if (existingRunning) {
      throw new ConflictError(
        `Flag already has a running experiment: '${existingRunning.name}'`
      );
    }

    logger.info('Creating experiment', { name: dto.name, flagId: dto.flagId });

    return experimentRepository.create(dto);
  }

  /**
   * Get all experiments
   */
  async getAllExperiments(flagId?: string): Promise<ExperimentWithVariants[]> {
    return experimentRepository.findAll(flagId);
  }

  /**
   * Get experiment by ID
   */
  async getExperimentById(id: string): Promise<ExperimentWithVariants> {
    const experiment = await experimentRepository.findById(id);
    if (!experiment) {
      throw new NotFoundError(`Experiment with ID '${id}' not found`);
    }
    return experiment;
  }

  /**
   * Get running experiment for a flag
   */
  async getRunningExperimentByFlagId(flagId: string): Promise<ExperimentWithVariants | null> {
    return experimentRepository.findRunningByFlagId(flagId);
  }

  /**
   * Update an experiment
   */
  async updateExperiment(
    id: string,
    dto: UpdateExperimentDTO
  ): Promise<ExperimentWithVariants> {
    const existing = await experimentRepository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Experiment with ID '${id}' not found`);
    }

    // Cannot update a running experiment's core properties
    if (existing.status === 'running' && dto.name) {
      throw new ValidationError('Cannot rename a running experiment');
    }

    await experimentRepository.update(id, dto);

    const updated = await experimentRepository.findById(id);
    if (!updated) {
      throw new Error('Failed to fetch updated experiment');
    }

    return updated;
  }

  /**
   * Start an experiment
   */
  async startExperiment(id: string): Promise<ExperimentWithVariants> {
    const experiment = await experimentRepository.findById(id);
    if (!experiment) {
      throw new NotFoundError(`Experiment with ID '${id}' not found`);
    }

    if (experiment.status === 'running') {
      throw new ValidationError('Experiment is already running');
    }

    if (experiment.status === 'stopped') {
      throw new ValidationError('Cannot restart a stopped experiment. Create a new one.');
    }

    // Validate variants still sum to 100
    const totalWeight = experiment.variants.reduce((sum, v) => sum + v.weight, 0);
    if (totalWeight !== 100) {
      throw new ValidationError(
        `Variant weights must sum to 100 before starting, got ${totalWeight}`
      );
    }

    // Check for other running experiments on this flag
    const existingRunning = await experimentRepository.findRunningByFlagId(
      experiment.flagId
    );
    if (existingRunning && existingRunning.id !== id) {
      throw new ConflictError(
        `Flag already has a running experiment: '${existingRunning.name}'`
      );
    }

    logger.info('Starting experiment', { id, name: experiment.name });

    await experimentRepository.updateStatus(id, 'running');

    const updated = await experimentRepository.findById(id);
    if (!updated) {
      throw new Error('Failed to fetch updated experiment');
    }

    return updated;
  }

  /**
   * Stop an experiment
   */
  async stopExperiment(id: string): Promise<ExperimentWithVariants> {
    const experiment = await experimentRepository.findById(id);
    if (!experiment) {
      throw new NotFoundError(`Experiment with ID '${id}' not found`);
    }

    if (experiment.status !== 'running') {
      throw new ValidationError('Experiment is not running');
    }

    logger.info('Stopping experiment', { id, name: experiment.name });

    await experimentRepository.updateStatus(id, 'stopped');

    const updated = await experimentRepository.findById(id);
    if (!updated) {
      throw new Error('Failed to fetch updated experiment');
    }

    return updated;
  }

  /**
   * Delete an experiment
   */
  async deleteExperiment(id: string): Promise<void> {
    const experiment = await experimentRepository.findById(id);
    if (!experiment) {
      throw new NotFoundError(`Experiment with ID '${id}' not found`);
    }

    if (experiment.status === 'running') {
      throw new ValidationError('Cannot delete a running experiment. Stop it first.');
    }

    logger.info('Deleting experiment', { id, name: experiment.name });

    await experimentRepository.delete(id);
  }

  /**
   * Update variant weights
   */
  async updateVariantWeights(
    experimentId: string,
    variants: Array<{ id: string; weight: number }>
  ): Promise<ExperimentWithVariants> {
    const experiment = await experimentRepository.findById(experimentId);
    if (!experiment) {
      throw new NotFoundError(`Experiment with ID '${experimentId}' not found`);
    }

    if (experiment.status === 'running') {
      throw new ValidationError('Cannot change weights on a running experiment');
    }

    // Validate weights sum to 100
    const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
    if (totalWeight !== 100) {
      throw new ValidationError(
        `Variant weights must sum to 100, got ${totalWeight}`
      );
    }

    await experimentRepository.updateVariantWeights(variants);

    const updated = await experimentRepository.findById(experimentId);
    if (!updated) {
      throw new Error('Failed to fetch updated experiment');
    }

    return updated;
  }
}

export const experimentService = new ExperimentService();
