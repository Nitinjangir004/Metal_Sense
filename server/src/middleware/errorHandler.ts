import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env.js';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) {
  const reqId = req.headers['x-request-id'] || 'unknown';

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      requestId: reqId,
    });
  }

  // Safe error response without stack trace leakage in production
  const status = 'status' in err && typeof err.status === 'number' ? err.status : 500;
  const message = status === 500 && env.NODE_ENV === 'production' ? 'Internal server error' : err.message;

  res.status(status).json({
    error: message,
    requestId: reqId,
  });
}
