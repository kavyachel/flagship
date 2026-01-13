import { Request, Response, NextFunction } from 'express';
import { eventService } from '../services/eventService.js';
import { CreateEventDTO } from '../models/event.js';
import { ValidationError } from '../middleware/errorHandler.js';

/**
 * Track a single event
 * POST /api/v1/events
 */
export async function trackEvent(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const dto: CreateEventDTO = {
      userId: req.body.userId as string,
      experimentId: req.body.experimentId as string | undefined,
      variantId: req.body.variantId as string | undefined,
      flagKey: req.body.flagKey as string | undefined,
      eventType: req.body.eventType as string,
      eventValue: req.body.eventValue as number | undefined,
      metadata: req.body.metadata as Record<string, unknown> | undefined,
    };

    if (!dto.userId) {
      throw new ValidationError('userId is required');
    }
    if (!dto.eventType) {
      throw new ValidationError('eventType is required');
    }

    const event = await eventService.trackEvent(dto);

    res.status(201).json({
      success: true,
      data: event,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Track multiple events in batch
 * POST /api/v1/events/batch
 */
export async function trackEventsBatch(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const events = req.body.events as CreateEventDTO[];

    if (!events || !Array.isArray(events)) {
      throw new ValidationError('events must be an array');
    }

    const result = await eventService.trackEventsBatch(events);

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get events for a user
 * GET /api/v1/events/user/:userId
 */
export async function getEventsByUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string, 10) || 100;

    if (!userId) {
      throw new ValidationError('userId is required');
    }

    const events = await eventService.getEventsByUser(userId, limit);

    res.json({
      success: true,
      data: events,
      count: events.length,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get events for an experiment
 * GET /api/v1/events/experiment/:experimentId
 */
export async function getEventsByExperiment(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { experimentId } = req.params;
    const limit = parseInt(req.query.limit as string, 10) || 1000;
    const offset = parseInt(req.query.offset as string, 10) || 0;

    if (!experimentId) {
      throw new ValidationError('experimentId is required');
    }

    const events = await eventService.getEventsByExperiment(experimentId, limit, offset);

    res.json({
      success: true,
      data: events,
      count: events.length,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get experiment metrics/analytics
 * GET /api/v1/events/metrics/:experimentId
 */
export async function getExperimentMetrics(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { experimentId } = req.params;
    const eventType = (req.query.eventType as string) || 'conversion';

    if (!experimentId) {
      throw new ValidationError('experimentId is required');
    }

    const metrics = await eventService.getExperimentMetrics(experimentId, eventType);

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get event summary for a time range
 * GET /api/v1/events/summary
 */
export async function getEventSummary(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Default: last 7 days

    const endDate = req.query.endDate
      ? new Date(req.query.endDate as string)
      : new Date();

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new ValidationError('Invalid date format');
    }

    const summary = await eventService.getEventSummary(startDate, endDate);

    res.json({
      success: true,
      data: summary,
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
}
