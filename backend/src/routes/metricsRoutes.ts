import { Router, Request, Response } from 'express';
import { metricsService } from '../utils/metrics.js';
import { cacheService } from '../cache/redis.js';

const router = Router();

/**
 * GET /metrics
 * Returns performance metrics including latency percentiles
 */
router.get('/', async (_req: Request, res: Response) => {
  const metrics = metricsService.getAllMetrics();

  // Add cache status
  const cacheAvailable = await cacheService.isAvailable();

  res.json({
    ...metrics,
    cache: {
      enabled: cacheAvailable,
      type: 'redis',
    },
  });
});

/**
 * GET /metrics/prometheus
 * Returns metrics in Prometheus format for scraping
 */
router.get('/prometheus', async (_req: Request, res: Response) => {
  const metrics = metricsService.getAllMetrics();

  let output = '';
  output += '# HELP flagship_request_duration_ms Request duration in milliseconds\n';
  output += '# TYPE flagship_request_duration_ms gauge\n';

  // Aggregate metrics
  output += `flagship_request_duration_ms{quantile="0.5"} ${metrics.aggregate.p50}\n`;
  output += `flagship_request_duration_ms{quantile="0.9"} ${metrics.aggregate.p90}\n`;
  output += `flagship_request_duration_ms{quantile="0.95"} ${metrics.aggregate.p95}\n`;
  output += `flagship_request_duration_ms{quantile="0.99"} ${metrics.aggregate.p99}\n`;

  output += '\n# HELP flagship_request_count Total request count in window\n';
  output += '# TYPE flagship_request_count gauge\n';
  output += `flagship_request_count ${metrics.aggregate.count}\n`;

  // Per-endpoint metrics
  for (const ep of metrics.endpoints) {
    const sanitizedEndpoint = ep.endpoint.replace(/[^a-zA-Z0-9_]/g, '_');
    output += `\n# Endpoint: ${ep.endpoint}\n`;
    output += `flagship_endpoint_duration_ms{endpoint="${sanitizedEndpoint}",quantile="0.95"} ${ep.p95}\n`;
    output += `flagship_endpoint_count{endpoint="${sanitizedEndpoint}"} ${ep.count}\n`;
  }

  // Cache metrics
  const cacheAvailable = await cacheService.isAvailable();
  output += '\n# HELP flagship_cache_available Cache availability (1=available, 0=unavailable)\n';
  output += '# TYPE flagship_cache_available gauge\n';
  output += `flagship_cache_available ${cacheAvailable ? 1 : 0}\n`;

  res.set('Content-Type', 'text/plain');
  res.send(output);
});

export default router;
