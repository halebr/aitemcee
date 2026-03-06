import { Request, Response, NextFunction } from 'express';

interface AppError extends Error {
  type?: string;
  step?: string;
  status?: number;
  retryable?: boolean;
}

export function errorHandler(err: AppError, req: Request, res: Response, next: NextFunction) {
  console.error(`[${err.step || 'unknown'}] ${err.message}`);

  const status = err.status || 500;
  res.status(status).json({
    error: {
      type: err.type || 'SERVER_UNREACHABLE',
      message: err.message || 'An unexpected error occurred',
      step: err.step || 'unknown',
      retryable: err.retryable !== undefined ? err.retryable : true,
    },
  });
}

export function createError(
  message: string,
  opts: { type?: string; step?: string; status?: number; retryable?: boolean } = {}
): AppError {
  const err: AppError = new Error(message);
  err.type = opts.type || 'SERVER_UNREACHABLE';
  err.step = opts.step || 'unknown';
  err.status = opts.status || 500;
  err.retryable = opts.retryable !== undefined ? opts.retryable : true;
  return err;
}
