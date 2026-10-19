/**
 * Generates official, downloadable CSV templates for laboratory and field data ingestion.
 * Note: All examples are clearly labeled as fictional benchmark data.
 */
export function generateCsvTemplate(): string {
  const headers = [
    'SampleCode',
    'SampleMatrix',
    'CollectionDate',
    'LocationName',
    'District',
    'Latitude',
    'Longitude',
    'LabName',
    'As_mg_L',
    'Pb_mg_L',
    'Cd_mg_L',
    'Cr_mg_L',
    'Cu_mg_L',
    'Fe_mg_L',
    'Zn_mg_L',
    'Ni_mg_L',
    'Notes',
  ];

  const exampleRows = [
    [
      'GW-BENCHMARK-01',
      'groundwater',
      '2026-03-20T10:00:00Z',
      'Fictional Monitoring Well #1',
      'Okhla Phase-II, Delhi',
      '28.5284',
      '77.2758',
      'Benchmark Analytical Services',
      '0.012',
      '0.008',
      '<0.001',
      '0.025',
      '0.05',
      '0.45',
      '1.20',
      '0.015',
      'Fictional benchmark demo row for template validation',
    ],
    [
      'GW-BENCHMARK-02',
      'groundwater',
      '2026-03-20T11:30:00Z',
      'Fictional Monitoring Well #2',
      'Mayapuri Industrial Area, Delhi',
      '28.6321',
      '77.1145',
      'Benchmark Analytical Services',
      '0.045',
      '0.022',
      '0.004',
      '0.060',
      '0.15',
      '1.80',
      '3.50',
      '0.032',
      'Elevated iron and lead in fictional industrial aquifer',
    ],
  ];

  const lines = [
    '# MetalSense Laboratory CSV Ingestion Template',
    '# INSTRUCTIONS: Units default to mg/L. For values below detection limit, prefix with < (e.g. <0.001).',
    '# All example data below is strictly fictional benchmark sample data.',
    headers.join(','),
    ...exampleRows.map((r) => r.map((c) => (c.includes(',') ? `"${c}"` : c)).join(',')),
  ];

  return lines.join('\n');
}
