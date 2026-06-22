import { Request, Response, NextFunction } from 'express';
import { ApiResponseBuilder } from '@facecraft/contracts';
import { AppError } from '../utils/errors';
import { logger } from '../config/logger';
import { ZodError } from 'zod';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  const requestId = (req as any).id || 'unknown';

  if (err instanceof ZodError) {
    const fieldErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));

    logger.warn({ err, requestId }, 'Validation error');

    return res.status(400).json(
      ApiResponseBuilder.error(
        'VALIDATION_ERROR',
        'Request validation failed',
        requestId,
        undefined,
        fieldErrors
      )
    );
  }

  if (err instanceof AppError) {
    logger.warn({ err, requestId, code: err.code }, 'Application error');

    return res.status(err.statusCode).json(
      ApiResponseBuilder.error(
        err.code,
        err.message,
        requestId,
        err.details,
        err.fieldErrors
      )
    );
  }

  logger.error({ err, requestId }, 'Unhandled error');

  return res.status(500).json(
    ApiResponseBuilder.error(
      'INTERNAL_SERVER_ERROR',
      'An unexpected error occurred',
      requestId
    )
  );
}
