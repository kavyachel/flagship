import { pool } from '../db/connection.js';
import {
  Experiment,
  ExperimentWithVariants,
  ExperimentRow,
  Variant,
  VariantRow,
  CreateExperimentDTO,
  UpdateExperimentDTO,
  CreateVariantDTO,
  ExperimentStatus,
  mapRowToExperiment,
  mapRowToVariant,
} from '../models/experiment.js';
import { logger } from '../utils/logger.js';

export class ExperimentRepository {
  /**
   * Create a new experiment with variants
   */
  async create(dto: CreateExperimentDTO): Promise<ExperimentWithVariants> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Create experiment
      const experimentQuery = `
        INSERT INTO experiments (flag_id, name, description)
        VALUES ($1, $2, $3)
        RETURNING *
      `;
      const experimentResult = await client.query<ExperimentRow>(experimentQuery, [
        dto.flagId,
        dto.name,
        dto.description ?? null,
      ]);
      const experimentRow = experimentResult.rows[0];

      if (!experimentRow) {
        throw new Error('Failed to create experiment');
      }

      const experiment = mapRowToExperiment(experimentRow);

      // Create variants
      const variants: Variant[] = [];
      for (const variantDto of dto.variants) {
        const variantQuery = `
          INSERT INTO variants (experiment_id, name, weight)
          VALUES ($1, $2, $3)
          RETURNING *
        `;
        const variantResult = await client.query<VariantRow>(variantQuery, [
          experiment.id,
          variantDto.name,
          variantDto.weight,
        ]);
        const variantRow = variantResult.rows[0];
        if (variantRow) {
          variants.push(mapRowToVariant(variantRow));
        }
      }

      await client.query('COMMIT');

      logger.info('Created experiment', { id: experiment.id, name: experiment.name });

      return { ...experiment, variants };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Find all experiments, optionally filtered by flag
   */
  async findAll(flagId?: string): Promise<ExperimentWithVariants[]> {
    let query = 'SELECT * FROM experiments';
    const values: string[] = [];

    if (flagId) {
      query += ' WHERE flag_id = $1';
      values.push(flagId);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query<ExperimentRow>(query, values);
    const experiments = result.rows.map(mapRowToExperiment);

    // Fetch variants for each experiment
    const experimentsWithVariants: ExperimentWithVariants[] = [];
    for (const experiment of experiments) {
      const variants = await this.findVariantsByExperimentId(experiment.id);
      experimentsWithVariants.push({ ...experiment, variants });
    }

    return experimentsWithVariants;
  }

  /**
   * Find an experiment by ID
   */
  async findById(id: string): Promise<ExperimentWithVariants | null> {
    const query = 'SELECT * FROM experiments WHERE id = $1';
    const result = await pool.query<ExperimentRow>(query, [id]);
    const row = result.rows[0];

    if (!row) return null;

    const experiment = mapRowToExperiment(row);
    const variants = await this.findVariantsByExperimentId(id);

    return { ...experiment, variants };
  }

  /**
   * Find a running experiment by flag ID
   */
  async findRunningByFlagId(flagId: string): Promise<ExperimentWithVariants | null> {
    const query = `
      SELECT * FROM experiments
      WHERE flag_id = $1 AND status = 'running'
      LIMIT 1
    `;
    const result = await pool.query<ExperimentRow>(query, [flagId]);
    const row = result.rows[0];

    if (!row) return null;

    const experiment = mapRowToExperiment(row);
    const variants = await this.findVariantsByExperimentId(experiment.id);

    return { ...experiment, variants };
  }

  /**
   * Find variants for an experiment
   */
  async findVariantsByExperimentId(experimentId: string): Promise<Variant[]> {
    const query = 'SELECT * FROM variants WHERE experiment_id = $1 ORDER BY weight DESC';
    const result = await pool.query<VariantRow>(query, [experimentId]);
    return result.rows.map(mapRowToVariant);
  }

  /**
   * Update an experiment
   */
  async update(id: string, dto: UpdateExperimentDTO): Promise<Experiment | null> {
    const updates: string[] = [];
    const values: string[] = [];
    let paramIndex = 1;

    if (dto.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(dto.name);
    }
    if (dto.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(dto.description);
    }

    if (updates.length === 0) {
      const existing = await this.findById(id);
      return existing;
    }

    values.push(id);

    const query = `
      UPDATE experiments
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query<ExperimentRow>(query, values);
    const row = result.rows[0];

    return row ? mapRowToExperiment(row) : null;
  }

  /**
   * Update experiment status
   */
  async updateStatus(id: string, status: ExperimentStatus): Promise<Experiment | null> {
    let query: string;
    const values: (string | Date)[] = [status, id];

    if (status === 'running') {
      query = `
        UPDATE experiments
        SET status = $1, started_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `;
    } else if (status === 'stopped') {
      query = `
        UPDATE experiments
        SET status = $1, stopped_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `;
    } else {
      query = `
        UPDATE experiments
        SET status = $1
        WHERE id = $2
        RETURNING *
      `;
    }

    const result = await pool.query<ExperimentRow>(query, values);
    const row = result.rows[0];

    logger.info('Updated experiment status', { id, status });

    return row ? mapRowToExperiment(row) : null;
  }

  /**
   * Delete an experiment
   */
  async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM experiments WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rowCount === 1;
  }

  /**
   * Add a variant to an experiment
   */
  async addVariant(experimentId: string, dto: CreateVariantDTO): Promise<Variant> {
    const query = `
      INSERT INTO variants (experiment_id, name, weight)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const result = await pool.query<VariantRow>(query, [
      experimentId,
      dto.name,
      dto.weight,
    ]);
    const row = result.rows[0];

    if (!row) {
      throw new Error('Failed to create variant');
    }

    return mapRowToVariant(row);
  }

  /**
   * Update variant weights
   */
  async updateVariantWeights(
    variants: Array<{ id: string; weight: number }>
  ): Promise<void> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      for (const { id, weight } of variants) {
        await client.query(
          'UPDATE variants SET weight = $1 WHERE id = $2',
          [weight, id]
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Delete a variant
   */
  async deleteVariant(id: string): Promise<boolean> {
    const query = 'DELETE FROM variants WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rowCount === 1;
  }
}

export const experimentRepository = new ExperimentRepository();
