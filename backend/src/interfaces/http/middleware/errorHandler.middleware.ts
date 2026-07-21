// src/interfaces/http/middleware/errorHandler.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../../../shared/errors/AppError';
import { logger } from '../../../shared/utils/logger';


export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof ValidationError) {
    res.status(400).json({
      success: false,
      message: err.message,
      errors: err.errors,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (err instanceof AppError) {
    if (!err.isOperational) {
      logger.error('Non-operational error:', err);
    }
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Mongoose duplicate key error
  if ((err as any).code === 11000) {
    const field = Object.keys((err as any).keyValue || {})[0];
    res.status(409).json({
      success: false,
      message: `${field} already exists`,
      code: 'CONFLICT',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      message: 'Database validation failed',
      code: 'VALIDATION_ERROR',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  logger.error('Unhandled error:', err);

  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    code: 'INTERNAL_SERVER_ERROR',
    timestamp: new Date().toISOString(),
  });
};