import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate, requireWorkspaceRole } from '../middleware/auth.js';
import { db } from '../db/store.js';
import { CreateSampleSchema, BIS_10500_2012, STANDARD_REGISTRY } from '@metalsense/shared';
import { calculateSampleIndices } from '../services/calculation/index.js';
import { aiService } from '../services/ai/adapter.js';
import { generateWorkspaceCsv, generateAuditPdf } from '../services/reports/reportGenerator.js';

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
 * POST /api/v1/workspaces/:workspaceId/samples/:sampleId/analyze
 * Dynamically re-compute pollution indices with selected standard and LOD strategy.
 */
workspacesRouter.post(
  '/:workspaceId/samples/:sampleId/analyze',
  requireWorkspaceRole('editor'),
  (req: Request, res: Response) => {
    const sample = db.findSampleById(req.params.sampleId);
    if (!sample || sample.workspaceId !== req.params.workspaceId) {
      return res.status(404).json({ error: 'Sample not found in this workspace.' });
    }

    const AnalyzeSchema = z.object({
      standardCode: z.string().default('BIS_10500_2012'),
      lodStrategy: z.enum(['half_lod', 'zero', 'full_lod']).default('half_lod'),
    });

    const { standardCode, lodStrategy } = AnalyzeSchema.parse(req.body);
    const standard = STANDARD_REGISTRY[standardCode] || BIS_10500_2012;

    const analysis = calculateSampleIndices(sample, {
      standard,
      lodStrategy,
    });

    db.analyses.set(sample.id, analysis);
    db.recordAudit(
      req.params.workspaceId,
      req.user!.id,
      'RECOMPUTE_ANALYSIS',
      'analysis',
      analysis.id,
      { sampleId: sample.id, standardCode: standard.code, lodStrategy }
    );

    res.json({
      data: {
        sample,
        analysis,
      },
    });
  }
);

/**
 * GET /api/v1/workspaces/:workspaceId/analyses/:analysisId
 */
workspacesRouter.get(
  '/:workspaceId/analyses/:analysisId',
  requireWorkspaceRole('viewer'),
  (req: Request, res: Response) => {
    const analysis = Array.from(db.analyses.values()).find(
      (a) => a.id === req.params.analysisId && a.workspaceId === req.params.workspaceId
    );

    if (!analysis) {
      return res.status(404).json({ error: 'Analysis record not found.' });
    }

    res.json({ data: analysis });
  }
);

/**
 * POST /api/v1/workspaces/:workspaceId/samples/:sampleId/explain
 * Generates an auditable, grounded natural-language explanation of sample analysis.
 */
workspacesRouter.post(
  '/:workspaceId/samples/:sampleId/explain',
  requireWorkspaceRole('viewer'),
  async (req: Request, res: Response) => {
    const sample = db.findSampleById(req.params.sampleId);
    if (!sample || sample.workspaceId !== req.params.workspaceId) {
      return res.status(404).json({ error: 'Sample not found in this workspace.' });
    }

    let analysis = db.analyses.get(sample.id);
    if (!analysis) {
      analysis = calculateSampleIndices(sample, {
        standard: BIS_10500_2012,
        lodStrategy: 'half_lod',
      });
      db.analyses.set(sample.id, analysis);
    }

    const explanation = await aiService.explainSample(analysis, sample);
    db.recordAudit(
      req.params.workspaceId,
      req.user!.id,
      'GENERATE_AI_EXPLANATION',
      'sample',
      sample.id
    );

    res.json({ data: explanation });
  }
);

/**
 * POST /api/v1/workspaces/:workspaceId/analyses/compare-summary
 * Generates a comparative narrative summary across multiple samples in the workspace.
 */
workspacesRouter.post(
  '/:workspaceId/analyses/compare-summary',
  requireWorkspaceRole('viewer'),
  async (req: Request, res: Response) => {
    const allSamples = db.findSamplesByWorkspace(req.params.workspaceId);
    const requestedIds = req.body?.sampleIds as string[] | undefined;

    const filteredSamples = requestedIds
      ? allSamples.filter((s) => requestedIds.includes(s.id))
      : allSamples;

    if (filteredSamples.length === 0) {
      return res.status(400).json({ error: 'No samples available for comparative summary.' });
    }

    const items = filteredSamples.map((sample) => {
      let analysis = db.analyses.get(sample.id);
      if (!analysis) {
        analysis = calculateSampleIndices(sample, {
          standard: BIS_10500_2012,
          lodStrategy: 'half_lod',
        });
        db.analyses.set(sample.id, analysis);
      }
      return { sample, analysis };
    });

    const summary = await aiService.compareSamples(items);
    res.json({ data: summary });
  }
);

/**
 * GET /api/v1/workspaces/:workspaceId/reports/csv
 * Exports an RFC-4180 compliant CSV matrix of all samples and evaluated indices.
 */
workspacesRouter.get(
  '/:workspaceId/reports/csv',
  requireWorkspaceRole('viewer'),
  (req: Request, res: Response) => {
    const ws = db.findWorkspaceById(req.params.workspaceId);
    if (!ws) {
      return res.status(404).json({ error: 'Workspace not found.' });
    }

    const samples = db.findSamplesByWorkspace(req.params.workspaceId);
    const items = samples.map((sample) => {
      let analysis = db.analyses.get(sample.id);
      if (!analysis) {
        analysis = calculateSampleIndices(sample, {
          standard: BIS_10500_2012,
          lodStrategy: 'half_lod',
        });
        db.analyses.set(sample.id, analysis);
      }
      return { sample, analysis };
    });

    const csvData = generateWorkspaceCsv(items);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="MetalSense_${ws.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_Matrix.csv"`
    );
    res.send(csvData);
  }
);

/**
 * GET /api/v1/workspaces/:workspaceId/reports/pdf
 * Generates an auditable, high-resolution PDF compliance dossier for the workspace.
 */
workspacesRouter.get(
  '/:workspaceId/reports/pdf',
  requireWorkspaceRole('viewer'),
  async (req: Request, res: Response, next) => {
    try {
      const ws = db.findWorkspaceById(req.params.workspaceId);
      if (!ws) {
        return res.status(404).json({ error: 'Workspace not found.' });
      }

      const standardCode = (req.query.standardCode as string) || 'BIS_10500_2012';
      const standard = STANDARD_REGISTRY[standardCode] || BIS_10500_2012;

      const samples = db.findSamplesByWorkspace(req.params.workspaceId);
      const items = samples.map((sample) => {
        let analysis = db.analyses.get(sample.id);
        if (!analysis || analysis.standardUsed.code !== standard.code) {
          analysis = calculateSampleIndices(sample, {
            standard,
            lodStrategy: 'half_lod',
          });
          db.analyses.set(sample.id, analysis);
        }
        return { sample, analysis };
      });

      const pdfBuffer = await generateAuditPdf(items, {
        workspaceName: ws.name,
        standard,
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="MetalSense_${ws.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_Dossier.pdf"`
      );
      res.send(pdfBuffer);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/workspaces/:workspaceId/samples/:sampleId/reports/pdf
 * Generates a focused single-sample PDF report.
 */
workspacesRouter.get(
  '/:workspaceId/samples/:sampleId/reports/pdf',
  requireWorkspaceRole('viewer'),
  async (req: Request, res: Response, next) => {
    try {
      const ws = db.findWorkspaceById(req.params.workspaceId);
      const sample = db.findSampleById(req.params.sampleId);
      if (!ws || !sample || sample.workspaceId !== req.params.workspaceId) {
        return res.status(404).json({ error: 'Sample not found in this workspace.' });
      }

      let analysis = db.analyses.get(sample.id);
      if (!analysis) {
        analysis = calculateSampleIndices(sample, {
          standard: BIS_10500_2012,
          lodStrategy: 'half_lod',
        });
        db.analyses.set(sample.id, analysis);
      }

      const pdfBuffer = await generateAuditPdf(
        [{ sample, analysis }],
        {
          workspaceName: ws.name,
          standard: STANDARD_REGISTRY[analysis.standardUsed.code] || BIS_10500_2012,
          reportId: `MS-SAMPLE-${sample.sampleCode}`,
        }
      );

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="MetalSense_${sample.sampleCode}_Dossier.pdf"`
      );
      res.send(pdfBuffer);
    } catch (err) {
      next(err);
    }
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
