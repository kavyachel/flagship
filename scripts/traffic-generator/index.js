#!/usr/bin/env node

import { program } from 'commander';
import http from 'http';
import https from 'https';

// CLI options
program
  .option('-u, --users <number>', 'Number of simulated users', '10000')
  .option('-d, --duration <seconds>', 'Test duration in seconds', '60')
  .option('-c, --concurrency <number>', 'Concurrent requests', '100')
  .option('-h, --host <url>', 'Target host', 'http://localhost:3000')
  .option('-f, --flags <list>', 'Comma-separated flag keys to evaluate', 'checkout_redesign,dark_mode,new_pricing')
  .option('-e, --environment <env>', 'Environment to test', 'staging')
  .option('--ramp-up <seconds>', 'Ramp-up time in seconds', '10')
  .parse();

const options = program.opts();

// Configuration
const config = {
  totalUsers: parseInt(options.users),
  durationSeconds: parseInt(options.duration),
  concurrency: parseInt(options.concurrency),
  baseUrl: options.host,
  flagKeys: options.flags.split(','),
  environment: options.environment,
  rampUpSeconds: parseInt(options.rampUp),
};

// Metrics collection
const metrics = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  latencies: [],
  errors: {},
  startTime: null,
  endTime: null,
};

// Generate random user ID
function generateUserId(index) {
  return `user_${index}_${Math.random().toString(36).substring(7)}`;
}

// Make HTTP request
function makeRequest(userId, flagKey) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const url = `${config.baseUrl}/api/v1/evaluate?flagKey=${flagKey}&userId=${userId}&environment=${config.environment}`;

    const protocol = url.startsWith('https') ? https : http;

    const req = protocol.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        const latency = Date.now() - startTime;
        metrics.latencies.push(latency);
        metrics.totalRequests++;

        if (res.statusCode >= 200 && res.statusCode < 300) {
          metrics.successfulRequests++;
        } else {
          metrics.failedRequests++;
          const errorKey = `HTTP_${res.statusCode}`;
          metrics.errors[errorKey] = (metrics.errors[errorKey] || 0) + 1;
        }

        resolve({ success: true, latency });
      });
    });

    req.on('error', (err) => {
      const latency = Date.now() - startTime;
      metrics.latencies.push(latency);
      metrics.totalRequests++;
      metrics.failedRequests++;

      const errorKey = err.code || 'UNKNOWN';
      metrics.errors[errorKey] = (metrics.errors[errorKey] || 0) + 1;

      resolve({ success: false, latency, error: err.message });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      metrics.failedRequests++;
      metrics.errors['TIMEOUT'] = (metrics.errors['TIMEOUT'] || 0) + 1;
      resolve({ success: false, error: 'Timeout' });
    });
  });
}

// Calculate percentile
function percentile(arr, p) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

// Print progress
function printProgress() {
  const elapsed = (Date.now() - metrics.startTime) / 1000;
  const rps = metrics.totalRequests / elapsed;
  const successRate = metrics.totalRequests > 0
    ? ((metrics.successfulRequests / metrics.totalRequests) * 100).toFixed(2)
    : 0;

  process.stdout.write(`\r[${elapsed.toFixed(0)}s] Requests: ${metrics.totalRequests} | RPS: ${rps.toFixed(0)} | Success: ${successRate}% | p95: ${percentile(metrics.latencies, 95)}ms`);
}

// Print final report
function printReport() {
  const duration = (metrics.endTime - metrics.startTime) / 1000;
  const rps = metrics.totalRequests / duration;

  console.log('\n');
  console.log('═'.repeat(60));
  console.log('                    LOAD TEST REPORT');
  console.log('═'.repeat(60));
  console.log(`
Configuration:
  Target:           ${config.baseUrl}
  Simulated Users:  ${config.totalUsers.toLocaleString()}
  Duration:         ${config.durationSeconds}s
  Concurrency:      ${config.concurrency}
  Flag Keys:        ${config.flagKeys.join(', ')}
  Environment:      ${config.environment}

Results:
  Total Requests:   ${metrics.totalRequests.toLocaleString()}
  Successful:       ${metrics.successfulRequests.toLocaleString()} (${((metrics.successfulRequests / metrics.totalRequests) * 100).toFixed(2)}%)
  Failed:           ${metrics.failedRequests.toLocaleString()} (${((metrics.failedRequests / metrics.totalRequests) * 100).toFixed(2)}%)
  Requests/sec:     ${rps.toFixed(2)}
  Duration:         ${duration.toFixed(2)}s

Latency (ms):
  Min:              ${Math.min(...metrics.latencies)}
  Max:              ${Math.max(...metrics.latencies)}
  Avg:              ${(metrics.latencies.reduce((a, b) => a + b, 0) / metrics.latencies.length).toFixed(2)}
  p50:              ${percentile(metrics.latencies, 50)}
  p90:              ${percentile(metrics.latencies, 90)}
  p95:              ${percentile(metrics.latencies, 95)}
  p99:              ${percentile(metrics.latencies, 99)}
`);

  if (Object.keys(metrics.errors).length > 0) {
    console.log('Errors:');
    for (const [error, count] of Object.entries(metrics.errors)) {
      console.log(`  ${error}: ${count}`);
    }
    console.log('');
  }

  console.log('═'.repeat(60));

  // Performance assessment
  const p95 = percentile(metrics.latencies, 95);
  if (p95 < 200) {
    console.log('✓ PASS: p95 latency is under 200ms target');
  } else {
    console.log(`✗ FAIL: p95 latency (${p95}ms) exceeds 200ms target`);
  }

  const successRate = (metrics.successfulRequests / metrics.totalRequests) * 100;
  if (successRate >= 99) {
    console.log('✓ PASS: Success rate is >= 99%');
  } else {
    console.log(`✗ FAIL: Success rate (${successRate.toFixed(2)}%) is below 99%`);
  }

  console.log('═'.repeat(60));
}

// Worker function
async function worker(workerId, userIds) {
  while (Date.now() < metrics.endTime) {
    const userId = userIds[Math.floor(Math.random() * userIds.length)];
    const flagKey = config.flagKeys[Math.floor(Math.random() * config.flagKeys.length)];

    await makeRequest(userId, flagKey);

    // Small delay to prevent overwhelming
    await new Promise(r => setTimeout(r, 10));
  }
}

// Main function
async function main() {
  console.log('═'.repeat(60));
  console.log('         FLAGSHIP - Synthetic Traffic Generator');
  console.log('═'.repeat(60));
  console.log(`
Starting load test with:
  - ${config.totalUsers.toLocaleString()} simulated users
  - ${config.durationSeconds}s duration
  - ${config.concurrency} concurrent workers
  - Target: ${config.baseUrl}
`);

  // Generate user IDs
  console.log('Generating user IDs...');
  const userIds = Array.from({ length: config.totalUsers }, (_, i) => generateUserId(i));

  // Ramp up
  console.log(`Ramping up over ${config.rampUpSeconds}s...`);

  metrics.startTime = Date.now();
  metrics.endTime = metrics.startTime + (config.durationSeconds * 1000);

  // Start progress reporting
  const progressInterval = setInterval(printProgress, 1000);

  // Start workers with ramp-up
  const workers = [];
  const rampUpDelay = (config.rampUpSeconds * 1000) / config.concurrency;

  for (let i = 0; i < config.concurrency; i++) {
    await new Promise(r => setTimeout(r, rampUpDelay));
    workers.push(worker(i, userIds));
  }

  // Wait for test to complete
  await Promise.all(workers);

  clearInterval(progressInterval);
  metrics.endTime = Date.now();

  // Print report
  printReport();
}

// Run
main().catch(console.error);
