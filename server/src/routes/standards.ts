import { Router, Request, Response } from 'express';
import { STANDARD_REGISTRY } from '@metalsense/shared';

export const standardsRouter = Router();

standardsRouter.get('/', (req: Request, res: Response) => {
  const list = Object.values(STANDARD_REGISTRY).map((std) => ({
    id: std.id,
    code: std.code,
    title: std.title,
    issuingOrganization: std.issuingOrganization,
    jurisdiction: std.jurisdiction,
    version: std.version,
    publicationYear: std.publicationYear,
    isDefault: std.isDefault,
    analyteCount: Object.keys(std.limits).length,
    limits: std.limits,
  }));
  res.json({ data: list });
});

standardsRouter.get('/:code', (req: Request, res: Response) => {
  const std = STANDARD_REGISTRY[req.params.code];
  if (!std) {
    return res.status(404).json({
      error: `Standard with code '${req.params.code}' not found in registry.`,
    });
  }
  res.json({ data: std });
});
