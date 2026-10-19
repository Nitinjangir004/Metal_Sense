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
 * Parses raw CSV lines conforming to RFC 4180 with support for quotes and escaped characters.
 */
function parseCsvLine(line: string): string[] {
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
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

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

  for (const [sym, def] of Object.entries(CANONICAL_METALS)) {
    const symbolLower = sym.toLowerCase();
    const nameLower = def.name.toLowerCase();

    if (
      clean.startsWith(symbolLower) ||
      clean.startsWith(nameLower) ||
      clean.includes(symbolLower)
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
  const lines = csvContent
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#'));

  if (lines.length < 2) {
    return {
      totalRows: 0,
      validCount: 0,
      errorCount: 1,
      samples: [],
      errors: [{ rowNumber: 1, message: 'CSV file is empty or missing headers.' }],
    };
  }

  const headers = parseCsvLine(lines[0]);
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

  for (let i = 1; i < lines.length; i++) {
    const rowNum = i + 1;
    const row = parseCsvLine(lines[i]);
    if (row.length === 0 || row.every((c) => c === '')) continue;

    const sampleCode = getCol(row, 'samplecode', 'sampleid', 'id', 'code');
    if (!sampleCode) {
      errors.push({ rowNumber: rowNum, message: 'Missing required Sample Identifier / Code.' });
      continue;
    }

    const locationName = getCol(row, 'locationname', 'location', 'site', 'well') || 'Unspecified Location';
    const district = getCol(row, 'district', 'area', 'city');
    const labName = getCol(row, 'labname', 'laboratory', 'lab');
    const dateStr = getCol(row, 'collectiondate', 'date', 'sampled_at');
    const matrixStr = getCol(row, 'samplematrix', 'matrix', 'type').toLowerCase();

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
        message: 'No valid heavy-metal analyte concentrations found in row.',
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
      laboratory: labName ? { name: labName } : undefined,
      measurements,
      provenance: {
        method: 'csv_import',
        originalFileName: fileName,
        extractedAt: new Date().toISOString(),
        isDemo: false,
      },
    });
  }

  return {
    totalRows: lines.length - 1,
    validCount: samples.length,
    errorCount: errors.length,
    samples,
    errors,
  };
}
