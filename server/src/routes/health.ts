import { Router, Request, Response } from 'express';
import { getDatabaseStatus } from '../db/connection.js';

export const healthRouter = Router();

healthRouter.get('/', (req: Request, res: Response) => {
  const dbStatus = getDatabaseStatus();
  const isHealthy = dbStatus.status === 'connected' || dbStatus.status === 'memory_fallback';

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ok' : 'degraded',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    service: 'MetalSense Heavy Metal Pollution Intelligence API',
    version: '1.0.0',
    calculationEngine: 'deterministic-v1.0.0',
    database: dbStatus,
  });
});
