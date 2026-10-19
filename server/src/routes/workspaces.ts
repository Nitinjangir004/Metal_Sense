import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate, requireWorkspaceRole } from '../middleware/auth.js';
import { db } from '../db/store.js';
import { CreateSampleSchema, BIS_10500_2012 } from '@metalsense/shared';
import { calculateSampleIndices } from '../services/calculation/index.js';

export const workspacesRouter = Router();

// Protect all workspace routes with authentication
workspacesRouter.use(authenticate);

/**
 * GET /api/v1/workspaces
 * List workspaces the caller belongs to.
 */
workspacesRouter.get('/', (req: Request, res: Response) => {
  const workspaces = db.findWorkspacesForUser(req.user!.id);
  res.json({ data: workspaces });
});

/**
 * POST /api/v1/workspaces
 * Create a new workspace.
 */
workspacesRouter.post('/', (req: Request, res: Response) => {
  const schema = z.object({ name: z.string().min(2) });
  const { name } = schema.parse(req.body);

  const ws = db.createWorkspace(req.user!.id, name);
  db.recordAudit(ws.id, req.user!.id, 'CREATE_WORKSPACE', 'workspace', ws.id);

  res.status(201).json({ data: ws });
});

/**
 * GET /api/v1/workspaces/:workspaceId/projects
 */
workspacesRouter.get(
  '/:workspaceId/projects',
  requireWorkspaceRole('viewer'),
  (req: Request, res: Response) => {
    const projects = db.findProjectsByWorkspace(req.params.workspaceId);
    res.json({ data: projects });
  }
);

/**
 * POST /api/v1/workspaces/:workspaceId/projects
 */
workspacesRouter.post(
  '/:workspaceId/projects',
  requireWorkspaceRole('editor'),
  (req: Request, res: Response) => {
    const schema = z.object({
      name: z.string().min(2),
      description: z.string().optional(),
    });
    const { name, description } = schema.parse(req.body);

    const project = db.createProject(req.params.workspaceId, name, description);
    db.recordAudit(
      req.params.workspaceId,
      req.user!.id,
      'CREATE_PROJECT',
      'project',
      project.id
    );

    res.status(201).json({ data: project });
  }
);

/**
 * GET /api/v1/workspaces/:workspaceId/samples
 * Multi-tenant safe: only returns samples belonging to this workspace.
 */
workspacesRouter.get(
  '/:workspaceId/samples',
  requireWorkspaceRole('viewer'),
  (req: Request, res: Response) => {
    const samples = db.findSamplesByWorkspace(req.params.workspaceId);
    res.json({ data: samples });
  }
);

/**
 * POST /api/v1/workspaces/:workspaceId/samples
 * Creates a sample and executes deterministic calculation.
 */
workspacesRouter.post(
  '/:workspaceId/samples',
  requireWorkspaceRole('editor'),
  (req: Request, res: Response) => {
    const body = CreateSampleSchema.parse({
      ...req.body,
      workspaceId: req.params.workspaceId,
    });

    const sample = db.createSample(body);
    const analysis = calculateSampleIndices(sample, {
      standard: BIS_10500_2012,
      lodStrategy: 'half_lod',
    });

    db.analyses.set(sample.id, analysis);
    db.recordAudit(
      req.params.workspaceId,
      req.user!.id,
      'CREATE_SAMPLE',
      'sample',
      sample.id,
      { sampleCode: sample.sampleCode }
    );

    res.status(201).json({
      data: {
        sample,
        analysis,
      },
    });
  }
);

/**
 * GET /api/v1/workspaces/:workspaceId/samples/:sampleId
 */
workspacesRouter.get(
  '/:workspaceId/samples/:sampleId',
  requireWorkspaceRole('viewer'),
  (req: Request, res: Response) => {
    const sample = db.findSampleById(req.params.sampleId);

    // Cross-tenant verification: sample must exist AND match workspaceId
    if (!sample || sample.workspaceId !== req.params.workspaceId) {
      return res.status(404).json({ error: 'Sample not found in this workspace.' });
    }

    const analysis = db.analyses.get(sample.id);

    res.json({
      data: {
        sample,
        analysis,
      },
    });
  }
);

/**
 * GET /api/v1/workspaces/:workspaceId/audit-logs
 * Requires owner role to inspect audit logs.
 */
workspacesRouter.get(
  '/:workspaceId/audit-logs',
  requireWorkspaceRole('owner'),
  (req: Request, res: Response) => {
    const logs = db.getAuditLogs(req.params.workspaceId);
    res.json({ data: logs });
  }
);
