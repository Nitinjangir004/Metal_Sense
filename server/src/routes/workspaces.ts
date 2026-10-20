import { Router, Request, Response, NextFunction } from 'express';
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
workspacesRouter.get('/', async (req: Request, res: Response) => {
  const workspaces = await db.findWorkspacesForUser(req.user!.id);
  res.json({ data: workspaces });
});

/**
 * POST /api/v1/workspaces
 * Create a new workspace.
 */
workspacesRouter.post('/', async (req: Request, res: Response) => {
  const schema = z.object({
    name: z.string().min(2),
    defaultStandard: z.string().optional(),
    defaultLodStrategy: z.enum(['zero', 'half_lod', 'full_lod']).optional(),
  });
  const { name, defaultStandard, defaultLodStrategy } = schema.parse(req.body);

  const ws = await db.createWorkspace(req.user!.id, name, {
    defaultStandard,
    defaultLodStrategy,
  });
  await db.recordAudit(ws.id, req.user!.id, 'CREATE_WORKSPACE', 'workspace', ws.id);

  res.status(201).json({ data: ws });
});

/**
 * GET /api/v1/workspaces/:workspaceId
 */
workspacesRouter.get(
  '/:workspaceId',
  requireWorkspaceRole('viewer'),
  async (req: Request, res: Response) => {
    const ws = await db.findWorkspaceById(req.params.workspaceId);
    if (!ws) {
      return res.status(404).json({ error: 'Workspace not found.' });
    }
    res.json({ data: ws });
  }
);

/**
 * PATCH /api/v1/workspaces/:workspaceId
 */
workspacesRouter.patch(
  '/:workspaceId',
  requireWorkspaceRole('owner'),
  async (req: Request, res: Response) => {
    const schema = z.object({
      name: z.string().min(2).optional(),
      defaultStandard: z.string().optional(),
      defaultLodStrategy: z.enum(['zero', 'half_lod', 'full_lod']).optional(),
    });
    const updates = schema.parse(req.body);
    const updated = await db.updateWorkspace(req.params.workspaceId, updates);
    if (!updated) {
      return res.status(404).json({ error: 'Workspace not found.' });
    }
    await db.recordAudit(
      req.params.workspaceId,
      req.user!.id,
      'UPDATE_WORKSPACE',
      'workspace',
      req.params.workspaceId,
      updates
    );
    res.json({ data: updated });
  }
);

/**
 * DELETE /api/v1/workspaces/:workspaceId
 */
workspacesRouter.delete(
  '/:workspaceId',
  requireWorkspaceRole('owner'),
  async (req: Request, res: Response) => {
    const success = await db.deleteWorkspace(req.params.workspaceId);
    if (!success) {
      return res.status(404).json({ error: 'Workspace not found.' });
    }
    res.json({ message: 'Workspace deleted successfully.' });
  }
);

/**
 * GET /api/v1/workspaces/:workspaceId/summary
 * Live KPI counts, recent samples, category distribution, and top exceeded metals.
 */
workspacesRouter.get(
  '/:workspaceId/summary',
  requireWorkspaceRole('viewer'),
  async (req: Request, res: Response) => {
    const summary = await db.getWorkspaceSummary(req.params.workspaceId);
    res.json({ data: summary });
  }
);

/**
 * GET /api/v1/workspaces/:workspaceId/projects
 */
workspacesRouter.get(
  '/:workspaceId/projects',
  requireWorkspaceRole('viewer'),
  async (req: Request, res: Response) => {
    const projects = await db.findProjectsByWorkspace(req.params.workspaceId);
    res.json({ data: projects });
  }
);

/**
 * POST /api/v1/workspaces/:workspaceId/projects
 */
workspacesRouter.post(
  '/:workspaceId/projects',
  requireWorkspaceRole('editor'),
  async (req: Request, res: Response) => {
    const schema = z.object({
      name: z.string().min(2),
      description: z.string().optional(),
    });
    const { name, description } = schema.parse(req.body);

    const project = await db.createProject(req.params.workspaceId, name, description);
    await db.recordAudit(
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
 * Multi-tenant safe: queries samples belonging to this workspace with filtering and pagination.
 */
workspacesRouter.get(
  '/:workspaceId/samples',
  requireWorkspaceRole('viewer'),
  async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 50;
    const search = (req.query.search as string) || undefined;
    const category = (req.query.category as 'low' | 'medium' | 'high') || undefined;
    const from = (req.query.from as string) || undefined;
    const to = (req.query.to as string) || undefined;
    const sort = (req.query.sort as string) || undefined;

    const { samples, total } = await db.findSamplesByWorkspace(req.params.workspaceId, {
      page,
      limit,
      search,
      category,
      from,
      to,
      sort,
    });

    // Attach latest analysis to each sample
    const latestAnalyses = await db.findLatestAnalysesForWorkspace(req.params.workspaceId);
    const enriched = samples.map((sample) => ({
      ...sample,
      analysis: latestAnalyses.get(sample.id) || null,
    }));

    res.json({
      data: enriched,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  }
);

/**
 * POST /api/v1/workspaces/:workspaceId/samples
 * Creates a sample and executes deterministic calculation.
 */
workspacesRouter.post(
  '/:workspaceId/samples',
  requireWorkspaceRole('editor'),
  async (req: Request, res: Response) => {
    const body = CreateSampleSchema.parse({
      ...req.body,
      workspaceId: req.params.workspaceId,
    });

    const sample = await db.createSample(body);
    const standardCode = (req.body?.standardCode as string) || 'BIS_10500_2012';
    const standard = STANDARD_REGISTRY[standardCode] || BIS_10500_2012;
    const lodStrategy = req.body?.lodStrategy || 'half_lod';

    const analysis = calculateSampleIndices(sample, {
      standard,
      lodStrategy,
    });

    await db.createAnalysis(analysis);
    await db.recordAudit(
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
  async (req: Request, res: Response) => {
    const sample = await db.findSampleById(req.params.sampleId);

    // Cross-tenant verification: sample must exist AND match workspaceId
    if (!sample || sample.workspaceId !== req.params.workspaceId) {
      return res.status(404).json({ error: 'Sample not found in this workspace.' });
    }

    const analysis = await db.findLatestAnalysisForSample(sample.id);

    res.json({
      data: {
        sample,
        analysis,
      },
    });
  }
);

/**
 * PATCH /api/v1/workspaces/:workspaceId/samples/:sampleId
 */
workspacesRouter.patch(
  '/:workspaceId/samples/:sampleId',
  requireWorkspaceRole('editor'),
  async (req: Request, res: Response) => {
    const existing = await db.findSampleById(req.params.sampleId);
    if (!existing || existing.workspaceId !== req.params.workspaceId) {
      return res.status(404).json({ error: 'Sample not found in this workspace.' });
    }

    const PatchSchema = z.object({
      sampleCode: z.string().min(2).optional(),
      collectionDate: z.string().optional(),
      location: z
        .object({
          name: z.string().optional(),
          coordinates: z
            .object({
              latitude: z.number().optional(),
              longitude: z.number().optional(),
            })
            .optional(),
          district: z.string().optional(),
          state: z.string().optional(),
        })
        .optional(),
      notes: z.string().optional(),
    });

    const updates = PatchSchema.parse(req.body);
    const updated = await db.updateSample(req.params.sampleId, updates as any);

    await db.recordAudit(
      req.params.workspaceId,
      req.user!.id,
      'UPDATE_SAMPLE',
      'sample',
      req.params.sampleId,
      updates
    );

    res.json({ data: updated });
  }
);

/**
 * DELETE /api/v1/workspaces/:workspaceId/samples/:sampleId
 */
workspacesRouter.delete(
  '/:workspaceId/samples/:sampleId',
  requireWorkspaceRole('owner'),
  async (req: Request, res: Response) => {
    const existing = await db.findSampleById(req.params.sampleId);
    if (!existing || existing.workspaceId !== req.params.workspaceId) {
      return res.status(404).json({ error: 'Sample not found in this workspace.' });
    }

    await db.deleteSample(req.params.sampleId);
    await db.recordAudit(
      req.params.workspaceId,
      req.user!.id,
      'DELETE_SAMPLE',
      'sample',
      req.params.sampleId,
      { sampleCode: existing.sampleCode }
    );

    res.json({ message: 'Sample deleted successfully.' });
  }
);

/**
 * POST /api/v1/workspaces/:workspaceId/samples/:sampleId/analyze
 * Dynamically re-compute pollution indices with selected standard and LOD strategy.
 * Keeps calculation runs immutable (creates a new AnalysisRun record).
 */
workspacesRouter.post(
  '/:workspaceId/samples/:sampleId/analyze',
  requireWorkspaceRole('editor'),
  async (req: Request, res: Response) => {
    const sample = await db.findSampleById(req.params.sampleId);
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

    // Save as new immutable analysis run
    await db.createAnalysis(analysis);
    await db.recordAudit(
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
  async (req: Request, res: Response) => {
    const analysis = await db.findAnalysisById(req.params.analysisId);

    if (!analysis || analysis.workspaceId !== req.params.workspaceId) {
      return res.status(404).json({ error: 'Analysis record not found.' });
    }

    res.json({ data: analysis });
  }
);

/**
 * GET /api/v1/workspaces/:workspaceId/analytics
 * Returns aggregated cross-sample comparison datasets for charts.
 */
workspacesRouter.get(
  '/:workspaceId/analytics',
  requireWorkspaceRole('viewer'),
  async (req: Request, res: Response) => {
    const standardCode = (req.query.standard as string) || 'BIS_10500_2012';
    const standard = STANDARD_REGISTRY[standardCode] || BIS_10500_2012;

    const { samples } = await db.findSamplesByWorkspace(req.params.workspaceId, { limit: 100 });
    const latestAnalyses = await db.findLatestAnalysesForWorkspace(req.params.workspaceId);

    const indexComparisons = samples.map((sample) => {
      let analysis = latestAnalyses.get(sample.id);
      if (!analysis || analysis.standardUsed.code !== standard.code) {
        analysis = calculateSampleIndices(sample, { standard, lodStrategy: 'half_lod' });
      }
      return {
        sampleId: sample.id,
        sampleCode: sample.sampleCode,
        locationName: sample.location.name,
        collectionDate: sample.collectionDate,
        hpi: Number(analysis.hpi.value.toFixed(2)),
        hpiClassification: analysis.hpi.classification,
        hei: Number(analysis.hei.value.toFixed(2)),
        cd: Number(analysis.cd.value.toFixed(2)),
      };
    });

    res.json({
      data: {
        standard: {
          code: standard.code,
          title: standard.title,
        },
        indexComparisons,
      },
    });
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
    const sample = await db.findSampleById(req.params.sampleId);
    if (!sample || sample.workspaceId !== req.params.workspaceId) {
      return res.status(404).json({ error: 'Sample not found in this workspace.' });
    }

    let analysis = await db.findLatestAnalysisForSample(sample.id);
    if (!analysis) {
      analysis = calculateSampleIndices(sample, {
        standard: BIS_10500_2012,
        lodStrategy: 'half_lod',
      });
      await db.createAnalysis(analysis);
    }

    const explanation = await aiService.explainSample(analysis, sample);
    await db.recordAudit(
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
    const { samples } = await db.findSamplesByWorkspace(req.params.workspaceId, { limit: 100 });
    const requestedIds = req.body?.sampleIds as string[] | undefined;

    const filteredSamples = requestedIds
      ? samples.filter((s) => requestedIds.includes(s.id))
      : samples;

    if (filteredSamples.length === 0) {
      return res.status(400).json({ error: 'No samples available for comparative summary.' });
    }

    const items = await Promise.all(
      filteredSamples.map(async (sample) => {
        let analysis = await db.findLatestAnalysisForSample(sample.id);
        if (!analysis) {
          analysis = calculateSampleIndices(sample, {
            standard: BIS_10500_2012,
            lodStrategy: 'half_lod',
          });
          await db.createAnalysis(analysis);
        }
        return { sample, analysis };
      })
    );

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
  async (req: Request, res: Response) => {
    const ws = await db.findWorkspaceById(req.params.workspaceId);
    if (!ws) {
      return res.status(404).json({ error: 'Workspace not found.' });
    }

    const { samples } = await db.findSamplesByWorkspace(req.params.workspaceId, { limit: 1000 });
    const items = await Promise.all(
      samples.map(async (sample) => {
        let analysis = await db.findLatestAnalysisForSample(sample.id);
        if (!analysis) {
          analysis = calculateSampleIndices(sample, {
            standard: BIS_10500_2012,
            lodStrategy: 'half_lod',
          });
          await db.createAnalysis(analysis);
        }
        return { sample, analysis };
      })
    );

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
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ws = await db.findWorkspaceById(req.params.workspaceId);
      if (!ws) {
        return res.status(404).json({ error: 'Workspace not found.' });
      }

      const standardCode = (req.query.standardCode as string) || 'BIS_10500_2012';
      const standard = STANDARD_REGISTRY[standardCode] || BIS_10500_2012;

      const { samples } = await db.findSamplesByWorkspace(req.params.workspaceId, { limit: 1000 });
      const items = await Promise.all(
        samples.map(async (sample) => {
          let analysis = await db.findLatestAnalysisForSample(sample.id);
          if (!analysis || analysis.standardUsed.code !== standard.code) {
            analysis = calculateSampleIndices(sample, {
              standard,
              lodStrategy: 'half_lod',
            });
            await db.createAnalysis(analysis);
          }
          return { sample, analysis };
        })
      );

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
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ws = await db.findWorkspaceById(req.params.workspaceId);
      const sample = await db.findSampleById(req.params.sampleId);
      if (!ws || !sample || sample.workspaceId !== req.params.workspaceId) {
        return res.status(404).json({ error: 'Sample not found in this workspace.' });
      }

      let analysis = await db.findLatestAnalysisForSample(sample.id);
      if (!analysis) {
        analysis = calculateSampleIndices(sample, {
          standard: BIS_10500_2012,
          lodStrategy: 'half_lod',
        });
        await db.createAnalysis(analysis);
      }

      const pdfBuffer = await generateAuditPdf([{ sample, analysis }], {
        workspaceName: ws.name,
        standard: STANDARD_REGISTRY[analysis.standardUsed.code] || BIS_10500_2012,
        reportId: `MS-SAMPLE-${sample.sampleCode}`,
      });

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
  async (req: Request, res: Response) => {
    const logs = await db.getAuditLogs(req.params.workspaceId);
    res.json({ data: logs });
  }
);
