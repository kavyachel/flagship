import { Request, Response, NextFunction } from 'express';
import { metricsService } from '../utils/metrics.js';

/**
 * Middleware to record request latencies for all endpoints.
 * Records the time from request start to response finish.
 */
export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();

  // Record when response finishes
  res.on('finish', () => {
    const latency = Date.now() - startTime;

    // Create a normalized endpoint key (e.g., "/api/v1/evaluate" instead of full URL with params)
    const endpoint = `${req.method} ${req.route?.path || req.path}`;

    metricsService.record(endpoint, latency);
  });

  next();
}
