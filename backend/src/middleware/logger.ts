import { Request, Response, NextFunction } from 'express';
import logger from '../lib/logger';

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = Date.now();

  // Log request (debug level)
  logger.debug(`${req.method} ${req.path}`, {
    query: req.query,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.request(req.method, req.path, res.statusCode, duration, {
      ip: req.ip,
      userId: req.user?.id,
    });
  });

  next();
};
