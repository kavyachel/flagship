import { createApp } from './app.js';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { testConnection, closePool } from './db/connection.js';

async function main(): Promise<void> {
  // Test database connection
  const dbConnected = await testConnection();
  if (!dbConnected) {
    logger.error('Failed to connect to database. Exiting...');
    process.exit(1);
  }

  const app = createApp();
  const { port } = config.server;

  const server = app.listen(port, () => {
    logger.info(`Flagship backend running on port ${port}`);
    logger.info(`Environment: ${config.server.nodeEnv}`);
    logger.info(`Health check: http://localhost:${port}/health`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received. Starting graceful shutdown...`);

    server.close(async () => {
      logger.info('HTTP server closed');
      await closePool();
      logger.info('Graceful shutdown complete');
      process.exit(0);
    });

    // Force shutdown after 30 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 30000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((error) => {
  logger.error('Failed to start application', error);
  process.exit(1);
});
