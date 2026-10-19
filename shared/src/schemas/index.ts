import { z } from 'zod';

export const MetalSymbolSchema = z.enum([
  'As',
  'Cd',
  'Cr',
  'Cu',
  'Fe',
  'Pb',
  'Mn',
  'Ni',
  'Zn',
  'Hg',
  'Al',
  'Ba',
  'Se',
]);

export const ConcentrationUnitSchema = z.enum(['mg/L', 'ug/L', 'ppm', 'ppb']);

export const MeasurementQualifierSchema = z.enum(['=', '<', '<=', '>', '>=']);

export const LODHandlingStrategySchema = z.enum(['zero', 'half_lod', 'full_lod']);

export const SampleMatrixSchema = z.enum(['drinking_water', 'groundwater', 'surface_water']);

export const CoordinatesSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  altitudeMeters: z.number().optional(),
  accuracyMeters: z.number().optional(),
});

export const AnalyteMeasurementSchema = z.object({
  symbol: MetalSymbolSchema,
  name: z.string().min(1),
  value: z.number().min(0, 'Concentration cannot be negative'),
  unit: ConcentrationUnitSchema,
  qualifier: MeasurementQualifierSchema.default('='),
  detectionLimit: z.number().min(0).optional(),
  uncertainty: z.number().min(0).optional(),
  sourcePage: z.number().int().min(1).optional(),
  confidence: z.number().min(0).max(1).optional(),
});

export const SamplingLocationSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Location name is required'),
  code: z.string().min(1),
  description: z.string().optional(),
  coordinates: CoordinatesSchema.optional(),
  isSensitive: z.boolean().default(false),
  district: z.string().optional(),
  state: z.string().optional(),
  country: z.string().default('India'),
});

export const SampleProvenanceSchema = z.object({
  method: z.enum(['manual', 'csv_import', 'ocr_document', 'demo_seed']),
  originalFileName: z.string().optional(),
  fileChecksum: z.string().optional(),
  extractedAt: z.string().optional(),
  verifiedByUserId: z.string().optional(),
  verifiedAt: z.string().optional(),
  isDemo: z.boolean().default(false),
});

export const CreateSampleSchema = z.object({
  workspaceId: z.string().min(1),
  projectId: z.string().min(1),
  sampleCode: z.string().min(2, 'Sample code must be at least 2 characters'),
  sampleMatrix: SampleMatrixSchema.default('groundwater'),
  collectionDate: z.string().datetime(),
  location: SamplingLocationSchema,
  laboratory: z
    .object({
      name: z.string().min(1),
      accreditationNumber: z.string().optional(),
      reportNumber: z.string().optional(),
      analystName: z.string().optional(),
    })
    .optional(),
  measurements: z
    .array(AnalyteMeasurementSchema)
    .min(1, 'At least one heavy metal measurement is required for pollution indexing'),
  notes: z.string().optional(),
  provenance: SampleProvenanceSchema,
});

export const AnalyzeSamplePayloadSchema = z.object({
  standardCode: z.string().default('BIS_10500_2012'),
  lodStrategy: LODHandlingStrategySchema.default('half_lod'),
  normalizedUnit: ConcentrationUnitSchema.default('ug/L'),
});
