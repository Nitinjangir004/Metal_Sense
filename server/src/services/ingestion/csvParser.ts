import {
  Sample,
  AnalyteMeasurement,
  MetalSymbol,
  ConcentrationUnit,
  MeasurementQualifier,
  SampleMatrix,
  CANONICAL_METALS,
} from '@metalsense/shared';
import crypto from 'crypto';

export interface ParsedCsvResult {
  totalRows: number;
  validCount: number;
  errorCount: number;
  samples: Omit<Sample, 'id' | 'createdAt' | 'updatedAt'>[];
  errors: { rowNumber: number; sampleCode?: string; message: string }[];
}

/**
 * Detects the most probable delimiter: comma, semicolon, or tab.
 */
function detectDelimiter(text: string): string {
  const lines = text.split(/\r?\n/).slice(0, 10);
  let commaCount = 0;
  let semiCount = 0;
  let tabCount = 0;

  for (const line of lines) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') inQuotes = !inQuotes;
      else if (!inQuotes) {
        if (line[i] === ',') commaCount++;
        else if (line[i] === ';') semiCount++;
        else if (line[i] === '\t') tabCount++;
      }
    }
  }

  if (semiCount > commaCount && semiCount > tabCount) return ';';
  if (tabCount > commaCount && tabCount > semiCount) return '\t';
  return ',';
}

/**
 * Parses raw CSV lines conforming to RFC 4180 with support for quotes, escaped characters, and custom delimiters.
 */
function parseCsvLine(line: string, delimiter: string = ','): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

const METADATA_HEADERS = new Set([
  'samplecode', 'sample_code', 'sampleid', 'sample_id', 'id', 'code', 'sample', 'station', 'stationid', 'station_id',
  'locationname', 'location_name', 'location', 'site', 'well', 'well_id', 'point',
  'district', 'area', 'city', 'state', 'region', 'taluk', 'block',
  'labname', 'lab_name', 'laboratory', 'lab', 'analyst',
  'reportnumber', 'report_number', 'reportno', 'report_no', 'report', 'batch', 'certificateno',
  'collectiondate', 'collection_date', 'date', 'sampled_at', 'sampledate', 'time',
  'samplematrix', 'sample_matrix', 'matrix', 'type', 'source',
  'latitude', 'lat', 'y', 'longitude', 'lng', 'long', 'x',
  'notes', 'remarks', 'comment', 'comments', 'description'
]);

/**
 * Extracts numeric value, qualifier (=, <, <=), and unit from a cell string.
 * Examples: "0.015", "< 0.001", "<=0.002", "ND" (Not Detected)
 */
function parseAnalyteCell(cell: string): {
  value: number;
  qualifier: MeasurementQualifier;
  detectionLimit?: number;
} | null {
  const trimmed = cell.trim();
  if (!trimmed || trimmed === '-' || trimmed === 'NA' || trimmed === 'N/A') {
    return null;
  }

  // Not Detected (ND) / BDL (Below Detection Limit)
  if (trimmed.toUpperCase() === 'ND' || trimmed.toUpperCase() === 'BDL') {
    return {
      value: 0.001, // default LOD heuristic
      qualifier: '<',
      detectionLimit: 0.001,
    };
  }

  let qualifier: MeasurementQualifier = '=';
  let numStr = trimmed;

  if (trimmed.startsWith('<=')) {
    qualifier = '<=';
    numStr = trimmed.substring(2).trim();
  } else if (trimmed.startsWith('<')) {
    qualifier = '<';
    numStr = trimmed.substring(1).trim();
  } else if (trimmed.startsWith('>=')) {
    qualifier = '>=';
    numStr = trimmed.substring(2).trim();
  } else if (trimmed.startsWith('>')) {
    qualifier = '>';
    numStr = trimmed.substring(1).trim();
  }

  const num = parseFloat(numStr);
  if (Number.isNaN(num)) {
    return null;
  }

  if (num < 0) {
    throw new Error(`Concentration cannot be negative: '${cell}'`);
  }

  return {
    value: num,
    qualifier,
    detectionLimit: qualifier === '<' || qualifier === '<=' ? num : undefined,
  };
}

/**
 * Maps header names to recognized metal symbols.
 * Examples: "As_mg_L", "Arsenic", "Pb", "Iron (Fe)"
 */
function matchAnalyteHeader(header: string): { symbol: MetalSymbol; unit: ConcentrationUnit } | null {
  const clean = header.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (METADATA_HEADERS.has(clean)) return null;

  for (const [sym, def] of Object.entries(CANONICAL_METALS)) {
    const symbolLower = sym.toLowerCase();
    const nameLower = def.name.toLowerCase();

    if (
      clean === symbolLower ||
      clean === nameLower ||
      clean.startsWith(symbolLower) ||
      clean.startsWith(nameLower)
    ) {
      // Detect unit if specified in header
      let unit: ConcentrationUnit = 'mg/L';
      if (header.toLowerCase().includes('ug') || header.toLowerCase().includes('ppb')) {
        unit = 'ug/L';
      }
      return { symbol: sym as MetalSymbol, unit };
    }
  }

  return null;
}

export function parseSamplesCsv(
  csvContent: string,
  workspaceId: string,
  projectId: string,
  fileName: string = 'imported.csv'
): ParsedCsvResult {
  // 1. Strip UTF-8 BOM
  csvContent = csvContent.replace(/^\uFEFF/, '').trim();

  // 2. Detect delimiter (comma, semicolon, tab)
  const delimiter = detectDelimiter(csvContent);

  const rawLines = csvContent
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => {
      if (l.length === 0) return false;
      const stripped = l.replace(/^["']/, '');
      return !stripped.startsWith('#') && !stripped.startsWith('//');
    });

  if (rawLines.length < 2) {
    return {
      totalRows: 0,
      validCount: 0,
      errorCount: 1,
      samples: [],
      errors: [{ rowNumber: 1, message: 'CSV file is empty or missing headers.' }],
    };
  }

  // 3. Find header row: scan until we find a line with sample identifier or metal columns
  let headerRowIndex = 0;
  for (let i = 0; i < Math.min(rawLines.length, 10); i++) {
    const testRow = parseCsvLine(rawLines[i], delimiter).map((c) =>
      c.toLowerCase().replace(/[^a-z0-9]/g, '')
    );
    const hasSampleId = testRow.some((c) =>
      ['samplecode', 'sampleid', 'id', 'code', 'sample', 'station', 'stationid', 'well'].includes(c)
    );
    const hasMetals = testRow.some((c) => matchAnalyteHeader(c) !== null);

    if (hasSampleId || hasMetals) {
      headerRowIndex = i;
      break;
    }
  }

  const headers = parseCsvLine(rawLines[headerRowIndex], delimiter);
  const headerMap: Record<string, number> = {};
  const analyteColumns: { index: number; symbol: MetalSymbol; unit: ConcentrationUnit }[] = [];

  headers.forEach((h, idx) => {
    const norm = h.toLowerCase().replace(/[^a-z0-9]/g, '');
    headerMap[norm] = idx;

    const matchedAnalyte = matchAnalyteHeader(h);
    if (matchedAnalyte) {
      analyteColumns.push({ index: idx, ...matchedAnalyte });
    }
  });

  const getCol = (row: string[], ...aliases: string[]): string => {
    for (const alias of aliases) {
      const idx = headerMap[alias.toLowerCase().replace(/[^a-z0-9]/g, '')];
      if (idx !== undefined && row[idx] !== undefined) {
        return row[idx];
      }
    }
    return '';
  };

  const samples: Omit<Sample, 'id' | 'createdAt' | 'updatedAt'>[] = [];
  const errors: { rowNumber: number; sampleCode?: string; message: string }[] = [];

  for (let i = headerRowIndex + 1; i < rawLines.length; i++) {
    const rowNum = i + 1;
    const row = parseCsvLine(rawLines[i], delimiter);
    if (row.length === 0 || row.every((c) => c === '')) continue;

    const sampleCode = getCol(
      row,
      'samplecode',
      'sample_code',
      'sampleid',
      'sample_id',
      'id',
      'code',
      'station',
      'stationid',
      'well'
    );
    if (!sampleCode) {
      errors.push({ rowNumber: rowNum, message: 'Missing required Sample Identifier / Code.' });
      continue;
    }

    // Ignore placeholder/example rows
    if (
      sampleCode.toUpperCase().includes('EXAMPLE-DELETE-ME') ||
      sampleCode.toUpperCase() === 'EXAMPLE'
    ) {
      continue;
    }

    const locationName =
      getCol(row, 'locationname', 'location_name', 'location', 'site', 'well', 'point') ||
      'Unspecified Location';
    const district = getCol(row, 'district', 'area', 'city');
    const labName = getCol(row, 'labname', 'lab_name', 'laboratory', 'lab');
    const dateStr = getCol(row, 'collectiondate', 'collection_date', 'date', 'sampled_at');
    const matrixStr = getCol(row, 'samplematrix', 'sample_matrix', 'matrix', 'type').toLowerCase();

    // Matrix
    let sampleMatrix: SampleMatrix = 'groundwater';
    if (matrixStr.includes('drink')) sampleMatrix = 'drinking_water';
    else if (matrixStr.includes('surface') || matrixStr.includes('river')) sampleMatrix = 'surface_water';

    // Date
    let collectionDate = new Date().toISOString();
    if (dateStr) {
      const parsedDate = new Date(dateStr);
      if (!Number.isNaN(parsedDate.getTime())) {
        collectionDate = parsedDate.toISOString();
      }
    }

    // Coordinates (Optional, only if valid numbers)
    const latStr = getCol(row, 'latitude', 'lat');
    const lngStr = getCol(row, 'longitude', 'lng', 'long');
    let coordinates = undefined;
    if (latStr && lngStr) {
      const lat = parseFloat(latStr);
      const lng = parseFloat(lngStr);
      if (!Number.isNaN(lat) && !Number.isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        coordinates = { latitude: lat, longitude: lng };
      }
    }

    // Extract measurements
    const measurements: AnalyteMeasurement[] = [];
    let hasNegative = false;

    for (const col of analyteColumns) {
      const rawCell = row[col.index];
      if (!rawCell) continue;

      try {
        const parsed = parseAnalyteCell(rawCell);
        if (parsed) {
          const metalDef = CANONICAL_METALS[col.symbol];
          measurements.push({
            symbol: col.symbol,
            name: metalDef?.name || col.symbol,
            value: parsed.value,
            unit: col.unit,
            qualifier: parsed.qualifier,
            detectionLimit: parsed.detectionLimit,
          });
        }
      } catch (err: any) {
        hasNegative = true;
        errors.push({
          rowNumber: rowNum,
          sampleCode,
          message: err.message || `Invalid analyte measurement for ${col.symbol}`,
        });
        break;
      }
    }

    if (hasNegative) continue;

    if (measurements.length === 0) {
      errors.push({
        rowNumber: rowNum,
        sampleCode,
        message: 'No valid heavy metal analyte measurements identified in row.',
      });
      continue;
    }

    samples.push({
      workspaceId,
      projectId,
      sampleCode,
      sampleMatrix,
      collectionDate,
      location: {
        id: `loc-${crypto.randomUUID()}`,
        name: locationName,
        code: `LOC-${sampleCode}`,
        district: district || undefined,
        coordinates,
        country: 'India',
        isSensitive: false,
      },
      laboratory: labName
        ? {
            name: labName,
            reportNumber:
              getCol(row, 'reportnumber', 'report_number', 'reportno', 'report_no', 'report') ||
              undefined,
          }
        : undefined,
      measurements,
      notes: getCol(row, 'notes', 'remarks', 'comment', 'comments') || undefined,
      provenance: {
        method: 'csv_import',
        originalFileName: fileName,
        extractedAt: new Date().toISOString(),
        isDemo: false,
      },
    });
  }

  return {
    totalRows: samples.length + errors.length,
    validCount: samples.length,
    errorCount: errors.length,
    samples,
    errors,
  };
}
