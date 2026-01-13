import dotenv from 'dotenv';

dotenv.config();

export const config = {
  server: {
    port: parseInt(process.env['PORT'] ?? '3000', 10),
    nodeEnv: process.env['NODE_ENV'] ?? 'development',
  },
  database: {
    host: process.env['DB_HOST'] ?? 'localhost',
    port: parseInt(process.env['DB_PORT'] ?? '5432', 10),
    name: process.env['DB_NAME'] ?? 'flagship',
    user: process.env['DB_USER'] ?? 'flagship',
    password: process.env['DB_PASSWORD'] ?? 'flagship_dev',
  },
  logging: {
    level: process.env['LOG_LEVEL'] ?? 'info',
  },
} as const;

export type Config = typeof config;
