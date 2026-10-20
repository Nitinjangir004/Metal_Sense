/**
 * Generates official, downloadable CSV template for laboratory data ingestion.
 * Contains standard column headers and a single clearly labelled example row.
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

  const exampleRow = [
    'EXAMPLE-DELETE-ME',
    'groundwater',
    '2026-03-20T10:00:00Z',
    'Example Sampling Well #1',
    'Central District',
    '28.5284',
    '77.2758',
    'Accredited Water Lab',
    '0.010',
    '0.010',
    '0.003',
    '0.050',
    '0.050',
    '0.300',
    '5.000',
    '0.020',
    'Example row for template guidance - delete before importing real data',
  ];

  const lines = [
    '# MetalSense Laboratory CSV Ingestion Template',
    '# Instructions: Standard units are mg/L. Enter below-detection values as <0.001. Delete example row before uploading.',
    headers.join(','),
    exampleRow.map((c) => (c.includes(',') ? `"${c}"` : c)).join(','),
  ];

  return lines.join('\n');
}
