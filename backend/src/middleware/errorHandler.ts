import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { AppError } from '../types';
import { config } from '../config/env';

export const errorHandler: ErrorRequestHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err.message || 'Internal Server Error';

  if (config.isDev) {
    console.error(`[Error] ${statusCode} - ${message}\n`, err.stack);
  } else if (statusCode === 500) {
    console.error(`[Fatal Server Error]`, err);
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(config.isDev && { stack: err.stack }),
  });
};
