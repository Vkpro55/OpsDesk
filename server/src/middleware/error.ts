import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { config } from '../config/config.js';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { getContext } from './requestContext.js';

export function notFound(req: Request, _res: Response, next: NextFunction) {
  next(
    new AppError('ROUTE_NOT_FOUND', 404, `Cannot ${req.method} ${req.path}`),
  );
}

// Express needs 4 args; keep _next.
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  let appError: AppError | null = null;
  if (err instanceof AppError) {
    appError = err;
  } else if (err instanceof ZodError) {
    appError = new AppError(
      'VALIDATION_ERROR',
      400,
      'Invalid request',
      err.issues,
    );
  }

  if (!appError) {
    logger.error({ err }, 'unhandled error');
  }
  const status = appError ? appError.status : 500;
  const code = appError ? appError.code : 'INTERNAL_ERROR';
  const message = appError ? appError.message : 'Internal server error';

  let details: unknown = {};
  if (appError?.details) {
    details = appError.details;
  } else if (
    !appError &&
    config.nodeEnv !== 'production' &&
    err instanceof Error
  ) {
    details = { stack: err.stack };
  }

  res.status(status).json({
    error: { code, message, details, requestId: getContext()?.requestId },
  });
}
