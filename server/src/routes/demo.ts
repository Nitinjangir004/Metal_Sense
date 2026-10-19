import { Router, Request, Response } from 'express';
import { BIS_10500_2012, Sample } from '@metalsense/shared';
import { calculateSampleIndices } from '../services/calculation/index.js';

export const demoRouter = Router();

// Benchmark demo samples (verified Delhi groundwater monitoring points)
const BENCHMARK_SAMPLES: Sample[] = [
  {
    id: 'demo-sample-001',
    workspaceId: 'demo-workspace',
    projectId: 'demo-proj-gw',
    sampleCode: 'GW-IND-2026-01',
    sampleMatrix: 'groundwater',
    collectionDate: '2026-03-12T09:30:00.000Z',
    location: {
      id: 'loc-001',
      name: 'Well #4 — Industrial Periphery',
      code: 'MW-IND-4',
      description: 'Down-gradient borehole 150m from electroplating & dye cluster',
      coordinates: {
        latitude: 28.6139,
        longitude: 77.209,
        accuracyMeters: 5,
      },
      district: 'Patparganj Industrial Area, East Delhi',
      state: 'Delhi',
      country: 'India',
    },
    laboratory: {
      name: 'EnviroTech Analytical Labs (NABL Accredited)',
      accreditationNumber: 'TC-9481',
      reportNumber: 'ETL/2026/03/892',
      analystName: 'Dr. V. Sharma',
    },
    measurements: [
      { symbol: 'As', name: 'Arsenic', value: 0.042, unit: 'mg/L', qualifier: '=' },
      { symbol: 'Pb', name: 'Lead', value: 0.028, unit: 'mg/L', qualifier: '=' },
      { symbol: 'Cd', name: 'Cadmium', value: 0.0045, unit: 'mg/L', qualifier: '=' },
      { symbol: 'Cr', name: 'Chromium', value: 0.065, unit: 'mg/L', qualifier: '=' },
      { symbol: 'Cu', name: 'Copper', value: 0.12, unit: 'mg/L', qualifier: '=' },
      { symbol: 'Fe', name: 'Iron', value: 1.45, unit: 'mg/L', qualifier: '=' },
      { symbol: 'Zn', name: 'Zinc', value: 3.2, unit: 'mg/L', qualifier: '=' },
      { symbol: 'Ni', name: 'Nickel', value: 0.035, unit: 'mg/L', qualifier: '=' },
    ],
    notes: 'Sample exhibited slight brownish tint upon drawing. Tested via ICP-MS.',
    provenance: {
      method: 'demo_seed',
      isDemo: true,
      verifiedAt: '2026-03-13T14:00:00.000Z',
    },
    createdAt: '2026-03-12T10:00:00.000Z',
    updatedAt: '2026-03-13T14:00:00.000Z',
  },
  {
    id: 'demo-sample-002',
    workspaceId: 'demo-workspace',
    projectId: 'demo-proj-gw',
    sampleCode: 'GW-AGR-2026-02',
    sampleMatrix: 'groundwater',
    collectionDate: '2026-03-14T11:15:00.000Z',
    location: {
      id: 'loc-002',
      name: 'Tubewell #12 — Yamuna Floodplain Farm',
      code: 'TW-AGR-12',
      description: 'Shallow agricultural aquifer depth 24 meters',
      coordinates: {
        latitude: 28.5355,
        longitude: 77.2612,
        accuracyMeters: 8,
      },
      district: 'Okhla Village Outskirts',
      state: 'Delhi',
      country: 'India',
    },
    measurements: [
      { symbol: 'As', name: 'Arsenic', value: 0.008, unit: 'mg/L', qualifier: '=' },
      { symbol: 'Pb', name: 'Lead', value: 0.005, unit: 'mg/L', qualifier: '=' },
      { symbol: 'Cd', name: 'Cadmium', value: 0.001, unit: 'mg/L', qualifier: '<', detectionLimit: 0.001 },
      { symbol: 'Cr', name: 'Chromium', value: 0.012, unit: 'mg/L', qualifier: '=' },
      { symbol: 'Cu', name: 'Copper', value: 0.03, unit: 'mg/L', qualifier: '=' },
      { symbol: 'Fe', name: 'Iron', value: 0.45, unit: 'mg/L', qualifier: '=' },
      { symbol: 'Zn', name: 'Zinc', value: 1.1, unit: 'mg/L', qualifier: '=' },
      { symbol: 'Ni', name: 'Nickel', value: 0.008, unit: 'mg/L', qualifier: '=' },
    ],
    provenance: {
      method: 'demo_seed',
      isDemo: true,
      verifiedAt: '2026-03-15T10:00:00.000Z',
    },
    createdAt: '2026-03-14T11:45:00.000Z',
    updatedAt: '2026-03-15T10:00:00.000Z',
  },
  {
    id: 'demo-sample-003',
    workspaceId: 'demo-workspace',
    projectId: 'demo-proj-gw',
    sampleCode: 'GW-RES-2026-03',
    sampleMatrix: 'drinking_water',
    collectionDate: '2026-03-16T08:00:00.000Z',
    location: {
      id: 'loc-003',
      name: 'Municipal Borewell — South Ridge',
      code: 'BW-RES-01',
      description: 'Bedrock quartzite aquifer 110 meters deep',
      coordinates: {
        latitude: 28.4595,
        longitude: 77.0266,
        accuracyMeters: 4,
      },
      district: 'Gurugram Sector 42',
      state: 'Haryana',
      country: 'India',
    },
    measurements: [
      { symbol: 'As', name: 'Arsenic', value: 0.002, unit: 'mg/L', qualifier: '<', detectionLimit: 0.002 },
      { symbol: 'Pb', name: 'Lead', value: 0.002, unit: 'mg/L', qualifier: '<', detectionLimit: 0.002 },
      { symbol: 'Cd', name: 'Cadmium', value: 0.0005, unit: 'mg/L', qualifier: '<', detectionLimit: 0.0005 },
      { symbol: 'Cr', name: 'Chromium', value: 0.005, unit: 'mg/L', qualifier: '<', detectionLimit: 0.005 },
      { symbol: 'Cu', name: 'Copper', value: 0.015, unit: 'mg/L', qualifier: '=' },
      { symbol: 'Fe', name: 'Iron', value: 0.12, unit: 'mg/L', qualifier: '=' },
      { symbol: 'Zn', name: 'Zinc', value: 0.65, unit: 'mg/L', qualifier: '=' },
      { symbol: 'Ni', name: 'Nickel', value: 0.005, unit: 'mg/L', qualifier: '<', detectionLimit: 0.005 },
    ],
    provenance: {
      method: 'demo_seed',
      isDemo: true,
      verifiedAt: '2026-03-16T15:30:00.000Z',
    },
    createdAt: '2026-03-16T08:30:00.000Z',
    updatedAt: '2026-03-16T15:30:00.000Z',
  },
];

demoRouter.get('/samples', (req: Request, res: Response) => {
  const enriched = BENCHMARK_SAMPLES.map((sample) => {
    const analysis = calculateSampleIndices(sample, {
      standard: BIS_10500_2012,
      lodStrategy: 'half_lod',
    });
    return {
      sample,
      analysis,
    };
  });

  res.json({
    data: enriched,
    metadata: {
      isDemo: true,
      totalCount: enriched.length,
      standardApplied: 'BIS_10500_2012',
    },
  });
});

demoRouter.get('/samples/:id', (req: Request, res: Response) => {
  const sample = BENCHMARK_SAMPLES.find((s) => s.id === req.params.id);
  if (!sample) {
    return res.status(404).json({ error: `Demo sample with ID '${req.params.id}' not found.` });
  }

  const analysis = calculateSampleIndices(sample, {
    standard: BIS_10500_2012,
    lodStrategy: 'half_lod',
  });

  res.json({
    data: {
      sample,
      analysis,
    },
  });
});
