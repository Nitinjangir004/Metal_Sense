import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate, requireWorkspaceRole } from '../middleware/auth.js';
import { uploadMiddleware, verifyFileMagicBytes } from '../middleware/upload.js';
import { generateCsvTemplate } from '../services/ingestion/template.js';
import { parseSamplesCsv } from '../services/ingestion/csvParser.js';
import { defaultDocumentExtractor } from '../services/extraction/adapter.js';
import { calculateSampleIndices } from '../services/calculation/index.js';
import { db } from '../db/store.js';
import { BIS_10500_2012, AnalyteMeasurementSchema } from '@metalsense/shared';
import fs from 'fs';

export const importsRouter = Router();

/**
 * GET /api/v1/imports/template.csv
 * Public / Authenticated route to download the standard CSV laboratory template.
 */
importsRouter.get('/template.csv', (req: Request, res: Response) => {
  const csvData = generateCsvTemplate();
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader(
    'Content-Disposition',
    'attachment; filename="MetalSense_Laboratory_Template.csv"'
  );
  res.send(csvData);
});

// Workspace-scoped protected ingestion endpoints
importsRouter.use(authenticate);

/**
 * POST /api/v1/imports/:workspaceId/csv/preview
 * Validates and previews CSV structure, rows, and mapped columns before persistent commit.
 */
importsRouter.post(
  '/:workspaceId/csv/preview',
  requireWorkspaceRole('editor'),
  uploadMiddleware.single('file'),
  async (req: Request, res: Response) => {
    let csvText = '';
    let fileName = 'preview.csv';

    if (req.file) {
      if (!verifyFileMagicBytes(req.file.path, req.file.mimetype)) {
        try {
          fs.unlinkSync(req.file.path);
        } catch {}
        return res
          .status(400)
          .json({ error: 'Uploaded file signature does not match CSV/text format.' });
      }
      csvText = fs.readFileSync(req.file.path, 'utf8');
      fileName = req.file.originalname;
      try {
        fs.unlinkSync(req.file.path);
      } catch {}
      try {
        fs.unlinkSync(req.file.path);
      } catch {}
    } else if (req.body?.csvText) {
      csvText = req.body.csvText;
      fileName = req.body.fileName || 'direct_paste.csv';
    } else {
      return res.status(400).json({
        error: 'No CSV file or csvText payload provided.',
      });
    }

    const projects = await db.findProjectsByWorkspace(req.params.workspaceId);
    const projectId = projects[0]?.id || 'proj-default';

    const parseResult = parseSamplesCsv(
      csvText,
      req.params.workspaceId,
      projectId,
      fileName
    );

    res.json({
      data: {
        fileName,
        totalRows: parseResult.totalRows,
        validCount: parseResult.validCount,
        errorCount: parseResult.errorCount,
        samples: parseResult.samples,
        errors: parseResult.errors,
        rawCsvText: csvText,
      },
    });
  }
);

/**
 * POST /api/v1/imports/:workspaceId/csv
 * Batch CSV matrix ingestion with row-level validation.
 */
importsRouter.post(
  '/:workspaceId/csv',
  requireWorkspaceRole('editor'),
  uploadMiddleware.single('file'),
  async (req: Request, res: Response) => {
    let csvText = '';
    let fileName = 'upload.csv';

    if (req.file) {
      if (!verifyFileMagicBytes(req.file.path, req.file.mimetype)) {
        try {
          fs.unlinkSync(req.file.path);
        } catch {}
        return res
          .status(400)
          .json({ error: 'Uploaded file signature does not match CSV/text format.' });
      }
      csvText = fs.readFileSync(req.file.path, 'utf8');
      fileName = req.file.originalname;
      try {
        fs.unlinkSync(req.file.path);
      } catch {}
    } else if (req.body?.csvText) {
      csvText = req.body.csvText;
      fileName = req.body.fileName || 'direct_paste.csv';
    } else {
      return res.status(400).json({
        error: 'No CSV file or csvText payload provided.',
      });
    }

    const projects = await db.findProjectsByWorkspace(req.params.workspaceId);
    const projectId = projects[0]?.id || 'proj-default';

    const parseResult = parseSamplesCsv(
      csvText,
      req.params.workspaceId,
      projectId,
      fileName
    );

    // Save valid samples and execute calculations
    const created = [];
    for (const sampleData of parseResult.samples) {
      const sample = await db.createSample(sampleData);
      const analysis = calculateSampleIndices(sample, {
        standard: BIS_10500_2012,
        lodStrategy: 'half_lod',
      });
      await db.createAnalysis(analysis);
      created.push({ sample, analysis });
    }

    await db.recordAudit(
      req.params.workspaceId,
      req.user!.id,
      'IMPORT_CSV',
      'sample_batch',
      `${created.length}_samples`,
      { fileName, validCount: created.length, errorCount: parseResult.errorCount }
    );

    res.status(201).json({
      data: {
        totalRows: parseResult.totalRows,
        validCount: created.length,
        errorCount: parseResult.errorCount,
        createdSamples: created,
        errors: parseResult.errors,
      },
    });
  }
);

/**
 * POST /api/v1/imports/:workspaceId/documents
 * PDF / Scanned image upload initiating an extraction job.
 */
importsRouter.post(
  '/:workspaceId/documents',
  requireWorkspaceRole('editor'),
  uploadMiddleware.single('file'),
  async (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No document file uploaded.' });
    }

    if (!verifyFileMagicBytes(req.file.path, req.file.mimetype)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch {}
      return res.status(400).json({
        error: 'Uploaded file signature does not match expected PDF/Image format.',
      });
    }

    const job = await db.createExtractionJob({
      workspaceId: req.params.workspaceId,
      userId: req.user!.id,
      originalFileName: req.file.originalname,
      fileKey: req.file.filename,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
      status: 'processing',
    });

    try {
      // Execute document extractor
      const extracted = await defaultDocumentExtractor.extractDocument(
        req.file.path,
        req.file.mimetype,
        req.file.originalname
      );

      await db.updateExtractionJob(job.id, {
        status: 'ready_for_review',
        proposedData: extracted,
      });

      await db.recordAudit(
        req.params.workspaceId,
        req.user!.id,
        'UPLOAD_DOCUMENT',
        'extraction_job',
        job.id,
        { fileName: req.file.originalname }
      );

      res.status(202).json({
        data: {
          jobId: job.id,
          status: 'ready_for_review',
          proposedData: extracted,
        },
      });
    } catch (err: any) {
      await db.updateExtractionJob(job.id, {
        status: 'failed',
        error: err.message || 'Document extraction failed',
      });
      res.status(500).json({
        error: `Document extraction failed: ${err.message}`,
        jobId: job.id,
      });
    }
  }
);

/**
 * GET /api/v1/imports/:workspaceId/:jobId
 * Poll status of extraction job.
 */
importsRouter.get(
  '/:workspaceId/:jobId',
  requireWorkspaceRole('viewer'),
  async (req: Request, res: Response) => {
    const job = await db.findExtractionJobById(req.params.jobId);
    if (!job || job.workspaceId !== req.params.workspaceId) {
      return res.status(404).json({ error: 'Extraction job not found.' });
    }
    res.json({ data: job });
  }
);

/**
 * POST /api/v1/imports/:workspaceId/:jobId/confirm
 * Mandatory human-in-the-loop confirmation: user approves or corrects extracted measurements.
 */
importsRouter.post(
  '/:workspaceId/:jobId/confirm',
  requireWorkspaceRole('editor'),
  async (req: Request, res: Response) => {
    const job = await db.findExtractionJobById(req.params.jobId);
    if (!job || job.workspaceId !== req.params.workspaceId) {
      return res.status(404).json({ error: 'Extraction job not found.' });
    }

    const ConfirmSchema = z.object({
      sampleCode: z.string().min(2),
      sampleMatrix: z
        .enum(['drinking_water', 'groundwater', 'surface_water'])
        .default('groundwater'),
      collectionDate: z.string().datetime(),
      locationName: z.string().min(1),
      district: z.string().optional(),
      measurements: z.array(AnalyteMeasurementSchema).min(1),
      notes: z.string().optional(),
    });

    const body = ConfirmSchema.parse(req.body);
    const projects = await db.findProjectsByWorkspace(req.params.workspaceId);
    const projectId = projects[0]?.id || 'proj-default';

    const sample = await db.createSample({
      workspaceId: req.params.workspaceId,
      projectId,
      sampleCode: body.sampleCode,
      sampleMatrix: body.sampleMatrix,
      collectionDate: body.collectionDate,
      location: {
        id: `loc-${Date.now()}`,
        name: body.locationName,
        code: `LOC-${body.sampleCode}`,
        district: body.district,
        country: 'India',
        isSensitive: false,
      },
      laboratory: job.proposedData?.laboratoryName
        ? {
            name: job.proposedData.laboratoryName,
            accreditationNumber: job.proposedData.accreditationNumber,
            reportNumber: job.proposedData.reportNumber,
          }
        : undefined,
      measurements: body.measurements,
      notes: body.notes,
      provenance: {
        method: 'ocr_document',
        originalFileName: job.originalFileName,
        extractedAt: job.createdAt,
        verifiedByUserId: req.user!.id,
        verifiedAt: new Date().toISOString(),
        isDemo: false,
      },
    });

    // Run deterministic calculation
    const analysis = calculateSampleIndices(sample, {
      standard: BIS_10500_2012,
      lodStrategy: 'half_lod',
    });
    await db.createAnalysis(analysis);

    await db.updateExtractionJob(job.id, {
      status: 'confirmed',
      confirmedAt: new Date().toISOString(),
      createdSampleId: sample.id,
    });

    await db.recordAudit(
      req.params.workspaceId,
      req.user!.id,
      'CONFIRM_OCR_EXTRACTION',
      'sample',
      sample.id,
      { jobId: job.id, sampleCode: sample.sampleCode }
    );

    res.status(201).json({
      data: {
        sample,
        analysis,
        jobId: job.id,
      },
    });
  }
);
