import {
  AnalyteMeasurement,
  RegulatoryStandard,
  CdResult,
  LODHandlingStrategy,
  convertConcentration,
  roundToPrecision,
} from '@metalsense/shared';

/**
 * Calculates Degree of Contamination (Cd) according to:
 * - Backman, B., et al. (1998)
 *
 * Formula:
 * Cd = sum( Cfi )
 * where:
 * Cfi = (CAi / CNi) - 1
 * CAi = monitored concentration
 * CNi = upper baseline / desirable limit
 */
export function calculateCd(
  measurements: AnalyteMeasurement[],
  standard: RegulatoryStandard,
  lodStrategy: LODHandlingStrategy = 'half_lod'
): CdResult {
  const traces: CdResult['traces'] = [];
  let sumCd = 0;

  for (const m of measurements) {
    const stdLimit = standard.limits[m.symbol];
    if (!stdLimit || stdLimit.acceptableLimit <= 0) {
      continue;
    }

    let effectiveVal = m.value;
    if (m.qualifier === '<' || m.qualifier === '<=') {
      const lod = m.detectionLimit ?? m.value;
      if (lodStrategy === 'zero') {
        effectiveVal = 0;
      } else if (lodStrategy === 'half_lod') {
        effectiveVal = lod / 2;
      } else {
        effectiveVal = lod;
      }
    }

    const monitoredConc = convertConcentration(effectiveVal, m.unit, stdLimit.unit);
    // Backman et al. (1998) baseline CNi represents upper permissible concentration (Si)
    const baselineLimit = stdLimit.permissibleLimit || stdLimit.acceptableLimit;
    const contaminationFactor = monitoredConc / baselineLimit - 1;

    sumCd += contaminationFactor;
    traces.push({
      symbol: m.symbol,
      monitoredConcentration: roundToPrecision(monitoredConc, 6),
      baselineLimit,
      contaminationFactor: roundToPrecision(contaminationFactor, 4),
    });
  }

  if (traces.length === 0) {
    throw new Error('Insufficient measurements to evaluate Degree of Contamination (Cd).');
  }

  // Classification scale (Backman et al. 1998):
  // Cd < 1: Low
  // 1 <= Cd <= 3: Medium
  // Cd > 3: High
  let classification: CdResult['classification'] = 'low';
  if (sumCd > 3) {
    classification = 'high';
  } else if (sumCd >= 1) {
    classification = 'medium';
  }

  return {
    value: roundToPrecision(sumCd, 2),
    classification,
    traces,
    evaluatedAnalytesCount: traces.length,
  };
}
