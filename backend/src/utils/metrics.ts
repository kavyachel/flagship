import { logger } from './logger.js';

interface LatencyBucket {
  latencies: number[];
  timestamp: number;
}

/**
 * Metrics service for tracking request latencies and performance.
 * Uses a sliding window approach to calculate percentiles.
 */
class MetricsService {
  private buckets: Map<string, LatencyBucket[]> = new Map();
  private windowSizeMs = 60000; // 1 minute window
  private bucketSizeMs = 5000; // 5 second buckets
  private maxBuckets = 12; // Keep 12 buckets (1 minute of data)

  /**
   * Record a latency measurement for an endpoint
   */
  record(endpoint: string, latencyMs: number): void {
    const now = Date.now();
    const bucketTimestamp = Math.floor(now / this.bucketSizeMs) * this.bucketSizeMs;

    if (!this.buckets.has(endpoint)) {
      this.buckets.set(endpoint, []);
    }

    const endpointBuckets = this.buckets.get(endpoint)!;

    // Find or create current bucket
    let currentBucket = endpointBuckets.find(b => b.timestamp === bucketTimestamp);
    if (!currentBucket) {
      currentBucket = { latencies: [], timestamp: bucketTimestamp };
      endpointBuckets.push(currentBucket);

      // Prune old buckets
      const cutoff = now - this.windowSizeMs;
      const prunedBuckets = endpointBuckets.filter(b => b.timestamp >= cutoff);
      this.buckets.set(endpoint, prunedBuckets);
    }

    currentBucket.latencies.push(latencyMs);
  }

  /**
   * Calculate percentile for an endpoint's latencies
   */
  percentile(endpoint: string, p: number): number {
    const endpointBuckets = this.buckets.get(endpoint);
    if (!endpointBuckets || endpointBuckets.length === 0) {
      return 0;
    }

    // Collect all latencies from recent buckets
    const cutoff = Date.now() - this.windowSizeMs;
    const allLatencies: number[] = [];

    for (const bucket of endpointBuckets) {
      if (bucket.timestamp >= cutoff) {
        allLatencies.push(...bucket.latencies);
      }
    }

    if (allLatencies.length === 0) {
      return 0;
    }

    // Sort and calculate percentile
    allLatencies.sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * allLatencies.length) - 1;
    return allLatencies[Math.max(0, index)] ?? 0;
  }

  /**
   * Get all metrics for an endpoint
   */
  getEndpointMetrics(endpoint: string): EndpointMetrics {
    const endpointBuckets = this.buckets.get(endpoint);
    if (!endpointBuckets || endpointBuckets.length === 0) {
      return {
        endpoint,
        count: 0,
        min: 0,
        max: 0,
        avg: 0,
        p50: 0,
        p90: 0,
        p95: 0,
        p99: 0,
      };
    }

    const cutoff = Date.now() - this.windowSizeMs;
    const allLatencies: number[] = [];

    for (const bucket of endpointBuckets) {
      if (bucket.timestamp >= cutoff) {
        allLatencies.push(...bucket.latencies);
      }
    }

    if (allLatencies.length === 0) {
      return {
        endpoint,
        count: 0,
        min: 0,
        max: 0,
        avg: 0,
        p50: 0,
        p90: 0,
        p95: 0,
        p99: 0,
      };
    }

    allLatencies.sort((a, b) => a - b);

    return {
      endpoint,
      count: allLatencies.length,
      min: allLatencies[0] ?? 0,
      max: allLatencies[allLatencies.length - 1] ?? 0,
      avg: Math.round(allLatencies.reduce((a, b) => a + b, 0) / allLatencies.length),
      p50: this.calcPercentile(allLatencies, 50),
      p90: this.calcPercentile(allLatencies, 90),
      p95: this.calcPercentile(allLatencies, 95),
      p99: this.calcPercentile(allLatencies, 99),
    };
  }

  /**
   * Get all tracked endpoints and their metrics
   */
  getAllMetrics(): MetricsSummary {
    const endpoints: EndpointMetrics[] = [];

    for (const endpoint of this.buckets.keys()) {
      endpoints.push(this.getEndpointMetrics(endpoint));
    }

    // Calculate aggregate metrics
    const allLatencies: number[] = [];
    for (const ep of endpoints) {
      // We need to re-collect since count doesn't give us individual values
      const endpointBuckets = this.buckets.get(ep.endpoint);
      if (endpointBuckets) {
        const cutoff = Date.now() - this.windowSizeMs;
        for (const bucket of endpointBuckets) {
          if (bucket.timestamp >= cutoff) {
            allLatencies.push(...bucket.latencies);
          }
        }
      }
    }

    let aggregate: EndpointMetrics = {
      endpoint: 'all',
      count: 0,
      min: 0,
      max: 0,
      avg: 0,
      p50: 0,
      p90: 0,
      p95: 0,
      p99: 0,
    };

    if (allLatencies.length > 0) {
      allLatencies.sort((a, b) => a - b);
      aggregate = {
        endpoint: 'all',
        count: allLatencies.length,
        min: allLatencies[0] ?? 0,
        max: allLatencies[allLatencies.length - 1] ?? 0,
        avg: Math.round(allLatencies.reduce((a, b) => a + b, 0) / allLatencies.length),
        p50: this.calcPercentile(allLatencies, 50),
        p90: this.calcPercentile(allLatencies, 90),
        p95: this.calcPercentile(allLatencies, 95),
        p99: this.calcPercentile(allLatencies, 99),
      };
    }

    return {
      timestamp: new Date().toISOString(),
      windowMs: this.windowSizeMs,
      aggregate,
      endpoints,
    };
  }

  private calcPercentile(sortedArr: number[], p: number): number {
    if (sortedArr.length === 0) return 0;
    const index = Math.ceil((p / 100) * sortedArr.length) - 1;
    return sortedArr[Math.max(0, index)] ?? 0;
  }

  /**
   * Reset all metrics (useful for testing)
   */
  reset(): void {
    this.buckets.clear();
  }
}

interface EndpointMetrics {
  endpoint: string;
  count: number;
  min: number;
  max: number;
  avg: number;
  p50: number;
  p90: number;
  p95: number;
  p99: number;
}

interface MetricsSummary {
  timestamp: string;
  windowMs: number;
  aggregate: EndpointMetrics;
  endpoints: EndpointMetrics[];
}

// Export singleton instance
export const metricsService = new MetricsService();
export type { EndpointMetrics, MetricsSummary };
