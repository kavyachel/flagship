/**
 * Event Model
 *
 * Events track user actions for analytics and experiment analysis.
 * Common event types: "purchase", "click", "signup", "conversion"
 */

export interface Event {
  id: string;
  userId: string;
  experimentId: string | null;
  variantId: string | null;
  flagKey: string | null;
  eventType: string;
  eventValue: number | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

export interface CreateEventDTO {
  userId: string;
  experimentId?: string;
  variantId?: string;
  flagKey?: string;
  eventType: string;
  eventValue?: number;
  metadata?: Record<string, unknown>;
}

export interface EventRow {
  id: string;
  user_id: string;
  experiment_id: string | null;
  variant_id: string | null;
  flag_key: string | null;
  event_type: string;
  event_value: string | null; // DECIMAL comes as string from pg
  metadata: Record<string, unknown> | null;
  created_at: Date;
}

export function mapRowToEvent(row: EventRow): Event {
  return {
    id: row.id,
    userId: row.user_id,
    experimentId: row.experiment_id,
    variantId: row.variant_id,
    flagKey: row.flag_key,
    eventType: row.event_type,
    eventValue: row.event_value ? parseFloat(row.event_value) : null,
    metadata: row.metadata,
    createdAt: row.created_at,
  };
}

/**
 * Analytics aggregation types
 */
export interface ExperimentMetrics {
  experimentId: string;
  experimentName: string;
  totalEvents: number;
  uniqueUsers: number;
  variantMetrics: VariantMetrics[];
}

export interface VariantMetrics {
  variantId: string;
  variantName: string;
  weight: number;
  totalEvents: number;
  uniqueUsers: number;
  conversionRate: number;
  averageValue: number | null;
}
