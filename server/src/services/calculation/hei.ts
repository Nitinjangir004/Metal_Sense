import {
  AnalyteMeasurement,
  RegulatoryStandard,
  HeiResult,
  LODHandlingStrategy,
  convertConcentration,
  roundToPrecision,
} from '@metalsense/shared';

/**
 * Calculates the Heavy Metal Evaluation Index (HEI) according to:
 * - Edet, A. E., & Offiong, O. E. (2002)
 *
 * Formula:
 * HEI = sum( Hc / Hmac )
 * where:
 * Hc = monitored concentration
 * Hmac = Maximum Admissible Concentration (permissible limit)
 */
export function calculateHei(
  measurements: AnalyteMeasurement[],
  standard: RegulatoryStandard,
  lodStrategy: LODHandlingStrategy = 'half_lod'
): HeiResult {
  const traces: HeiResult['traces'] = [];
  let sumRatio = 0;

  for (const m of measurements) {
    const stdLimit = standard.limits[m.symbol];
    if (!stdLimit || stdLimit.permissibleLimit <= 0) {
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
    const mac = stdLimit.permissibleLimit;
    const ratio = monitoredConc / mac;

    sumRatio += ratio;
    traces.push({
      symbol: m.symbol,
      monitoredConcentration: roundToPrecision(monitoredConc, 6),
      mac,
      ratio: roundToPrecision(ratio, 4),
    });
  }

  if (traces.length === 0) {
    throw new Error('Insufficient measurements to evaluate HEI.');
  }

  // Classification scale (Edet & Offiong 2002):
  // HEI < 10: Low
  // 10 <= HEI <= 20: Medium
  // HEI > 20: High
  let classification: HeiResult['classification'] = 'low';
  if (sumRatio > 20) {
    classification = 'high';
  } else if (sumRatio >= 10) {
    classification = 'medium';
  }

  return {
    value: roundToPrecision(sumRatio, 2),
    classification,
    traces,
    evaluatedAnalytesCount: traces.length,
  };
}
