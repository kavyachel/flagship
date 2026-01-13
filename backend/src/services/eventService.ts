import { Event, CreateEventDTO, ExperimentMetrics } from '../models/event.js';
import { eventRepository } from '../repositories/eventRepository.js';
import { experimentRepository } from '../repositories/experimentRepository.js';
import { ValidationError, NotFoundError } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';

export class EventService {
  /**
   * Track a single event
   */
  async trackEvent(dto: CreateEventDTO): Promise<Event> {
    // Validate required fields
    if (!dto.userId) {
      throw new ValidationError('userId is required');
    }
    if (!dto.eventType) {
      throw new ValidationError('eventType is required');
    }

    // Validate experiment exists if provided
    if (dto.experimentId) {
      const experiment = await experimentRepository.findById(dto.experimentId);
      if (!experiment) {
        throw new ValidationError(
          `Experiment with ID '${dto.experimentId}' not found`
        );
      }

      // Validate variant belongs to experiment if provided
      if (dto.variantId) {
        const variantExists = experiment.variants.some(
          (v) => v.id === dto.variantId
        );
        if (!variantExists) {
          throw new ValidationError(
            `Variant '${dto.variantId}' does not belong to experiment '${dto.experimentId}'`
          );
        }
      }
    }

    logger.debug('Tracking event', {
      userId: dto.userId,
      eventType: dto.eventType,
      experimentId: dto.experimentId,
    });

    return eventRepository.create(dto);
  }

  /**
   * Track multiple events in batch
   */
  async trackEventsBatch(events: CreateEventDTO[]): Promise<{ count: number }> {
    if (events.length === 0) {
      return { count: 0 };
    }

    if (events.length > 1000) {
      throw new ValidationError('Cannot process more than 1000 events at once');
    }

    // Basic validation
    for (const event of events) {
      if (!event.userId) {
        throw new ValidationError('All events must have a userId');
      }
      if (!event.eventType) {
        throw new ValidationError('All events must have an eventType');
      }
    }

    logger.info('Tracking batch events', { count: events.length });

    const count = await eventRepository.createBatch(events);
    return { count };
  }

  /**
   * Get events for a user
   */
  async getEventsByUser(userId: string, limit = 100): Promise<Event[]> {
    return eventRepository.findByUser(userId, limit);
  }

  /**
   * Get events for an experiment
   */
  async getEventsByExperiment(
    experimentId: string,
    limit = 1000,
    offset = 0
  ): Promise<Event[]> {
    const experiment = await experimentRepository.findById(experimentId);
    if (!experiment) {
      throw new NotFoundError(`Experiment with ID '${experimentId}' not found`);
    }

    return eventRepository.findByExperiment(experimentId, limit, offset);
  }

  /**
   * Get experiment metrics/analytics
   */
  async getExperimentMetrics(
    experimentId: string,
    eventType = 'conversion'
  ): Promise<ExperimentMetrics> {
    const metrics = await eventRepository.getExperimentMetrics(
      experimentId,
      eventType
    );

    if (!metrics) {
      throw new NotFoundError(`Experiment with ID '${experimentId}' not found`);
    }

    return metrics;
  }

  /**
   * Get event summary for a time range
   */
  async getEventSummary(
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ eventType: string; count: number }>> {
    return eventRepository.getEventCountsByType(startDate, endDate);
  }
}

export const eventService = new EventService();
