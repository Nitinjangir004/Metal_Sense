import { Router, Request, Response } from 'express';

export const healthRouter = Router();

healthRouter.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    service: 'MetalSense Heavy Metal Pollution Intelligence API',
    version: '1.0.0',
    calculationEngine: 'deterministic-v1.0.0',
  });
});
