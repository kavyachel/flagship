import { pool } from '../db/connection.js';
import {
  Event,
  EventRow,
  CreateEventDTO,
  ExperimentMetrics,
  VariantMetrics,
  mapRowToEvent,
} from '../models/event.js';
import { logger } from '../utils/logger.js';

export class EventRepository {
  /**
   * Create a new event
   */
  async create(dto: CreateEventDTO): Promise<Event> {
    const query = `
      INSERT INTO events (user_id, experiment_id, variant_id, flag_key, event_type, event_value, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      dto.userId,
      dto.experimentId ?? null,
      dto.variantId ?? null,
      dto.flagKey ?? null,
      dto.eventType,
      dto.eventValue ?? null,
      dto.metadata ? JSON.stringify(dto.metadata) : null,
    ];

    const result = await pool.query<EventRow>(query, values);
    const row = result.rows[0];

    if (!row) {
      throw new Error('Failed to create event');
    }

    logger.debug('Created event', { userId: dto.userId, eventType: dto.eventType });

    return mapRowToEvent(row);
  }

  /**
   * Batch create events (for high-throughput ingestion)
   */
  async createBatch(events: CreateEventDTO[]): Promise<number> {
    if (events.length === 0) return 0;

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      let insertedCount = 0;
      for (const dto of events) {
        const query = `
          INSERT INTO events (user_id, experiment_id, variant_id, flag_key, event_type, event_value, metadata)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;
        await client.query(query, [
          dto.userId,
          dto.experimentId ?? null,
          dto.variantId ?? null,
          dto.flagKey ?? null,
          dto.eventType,
          dto.eventValue ?? null,
          dto.metadata ? JSON.stringify(dto.metadata) : null,
        ]);
        insertedCount++;
      }

      await client.query('COMMIT');
      logger.info('Batch created events', { count: insertedCount });
      return insertedCount;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Find events by experiment
   */
  async findByExperiment(
    experimentId: string,
    limit = 1000,
    offset = 0
  ): Promise<Event[]> {
    const query = `
      SELECT * FROM events
      WHERE experiment_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await pool.query<EventRow>(query, [experimentId, limit, offset]);
    return result.rows.map(mapRowToEvent);
  }

  /**
   * Find events by user
   */
  async findByUser(userId: string, limit = 100): Promise<Event[]> {
    const query = `
      SELECT * FROM events
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;
    const result = await pool.query<EventRow>(query, [userId, limit]);
    return result.rows.map(mapRowToEvent);
  }

  /**
   * Get experiment metrics for analytics
   */
  async getExperimentMetrics(
    experimentId: string,
    eventType = 'conversion'
  ): Promise<ExperimentMetrics | null> {
    // Get experiment info
    const experimentQuery = `
      SELECT e.id, e.name
      FROM experiments e
      WHERE e.id = $1
    `;
    const experimentResult = await pool.query<{ id: string; name: string }>(
      experimentQuery,
      [experimentId]
    );
    const experiment = experimentResult.rows[0];

    if (!experiment) return null;

    // Get total events and unique users
    const totalsQuery = `
      SELECT
        COUNT(*) as total_events,
        COUNT(DISTINCT user_id) as unique_users
      FROM events
      WHERE experiment_id = $1 AND event_type = $2
    `;
    const totalsResult = await pool.query<{
      total_events: string;
      unique_users: string;
    }>(totalsQuery, [experimentId, eventType]);
    const totals = totalsResult.rows[0];

    // Get variant-level metrics
    const variantMetricsQuery = `
      SELECT
        v.id as variant_id,
        v.name as variant_name,
        v.weight,
        COUNT(e.id) as total_events,
        COUNT(DISTINCT e.user_id) as unique_users,
        AVG(e.event_value) as avg_value
      FROM variants v
      LEFT JOIN events e ON e.variant_id = v.id AND e.event_type = $2
      WHERE v.experiment_id = $1
      GROUP BY v.id, v.name, v.weight
      ORDER BY v.weight DESC
    `;
    const variantResult = await pool.query<{
      variant_id: string;
      variant_name: string;
      weight: number;
      total_events: string;
      unique_users: string;
      avg_value: string | null;
    }>(variantMetricsQuery, [experimentId, eventType]);

    // Calculate total assigned users for conversion rate
    // This is an approximation - in production you'd track assignments separately
    const totalUniqueUsers = parseInt(totals?.unique_users ?? '0', 10);

    const variantMetrics: VariantMetrics[] = variantResult.rows.map((row) => {
      const variantUsers = parseInt(row.unique_users, 10);
      const totalEvents = parseInt(row.total_events, 10);
      // Estimate assigned users based on weight proportion
      const estimatedAssigned = Math.round(
        (row.weight / 100) * totalUniqueUsers * 1.5 // Rough estimate with buffer
      );
      const conversionRate =
        estimatedAssigned > 0 ? (variantUsers / Math.max(estimatedAssigned, variantUsers)) * 100 : 0;

      return {
        variantId: row.variant_id,
        variantName: row.variant_name,
        weight: row.weight,
        totalEvents,
        uniqueUsers: variantUsers,
        conversionRate: Math.round(conversionRate * 100) / 100,
        averageValue: row.avg_value ? parseFloat(row.avg_value) : null,
      };
    });

    return {
      experimentId: experiment.id,
      experimentName: experiment.name,
      totalEvents: parseInt(totals?.total_events ?? '0', 10),
      uniqueUsers: totalUniqueUsers,
      variantMetrics,
    };
  }

  /**
   * Get event counts by type for a time range
   */
  async getEventCountsByType(
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ eventType: string; count: number }>> {
    const query = `
      SELECT event_type, COUNT(*) as count
      FROM events
      WHERE created_at >= $1 AND created_at <= $2
      GROUP BY event_type
      ORDER BY count DESC
    `;
    const result = await pool.query<{ event_type: string; count: string }>(query, [
      startDate,
      endDate,
    ]);

    return result.rows.map((row) => ({
      eventType: row.event_type,
      count: parseInt(row.count, 10),
    }));
  }
}

export const eventRepository = new EventRepository();
