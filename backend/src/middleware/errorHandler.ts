import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(statusCode: number, message: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(404, message);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message);
  }
}

interface ErrorResponse {
  error: {
    message: string;
    statusCode: number;
    stack?: string;
  };
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  logger.error('Error caught by handler:', err);

  if (err instanceof AppError) {
    const response: ErrorResponse = {
      error: {
        message: err.message,
        statusCode: err.statusCode,
      },
    };

    if (process.env['NODE_ENV'] === 'development') {
      response.error.stack = err.stack;
    }

    res.status(err.statusCode).json(response);
    return;
  }

  // Unhandled errors
  const response: ErrorResponse = {
    error: {
      message: 'Internal server error',
      statusCode: 500,
    },
  };

  if (process.env['NODE_ENV'] === 'development') {
    response.error.message = err.message;
    response.error.stack = err.stack;
  }

  res.status(500).json(response);
}
