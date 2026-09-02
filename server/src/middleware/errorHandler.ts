import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { sendError } from '../utils/response';
import { logger } from '../utils/logger';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  logger.error(`Unhandled error in [${req.method} ${req.url}]:`, err);

  if (err instanceof ZodError) {
    const details = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return sendError(res, 'Input validation failed', 422, 'VALIDATION_ERROR', details);
  }

  // Handle specific known business errors
  const message = err.message || 'Internal server error occurred';
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';

  return sendError(res, message, statusCode, code, err.details);
};
