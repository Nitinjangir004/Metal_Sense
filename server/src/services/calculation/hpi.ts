import {
  AnalyteMeasurement,
  RegulatoryStandard,
  HpiResult,
  SubIndexTrace,
  LODHandlingStrategy,
  MetalSymbol,
  convertConcentration,
  roundToPrecision,
} from '@metalsense/shared';

/**
 * Calculates the Heavy Metal Pollution Index (HPI) according to:
 * - Mohan, S. V., Nithila, P., & Reddy, S. J. (1996)
 * - Prasad, B., & Bose, J. M. (2001)
 *
 * Formula:
 * HPI = (sum(Wi * Qi)) / (sum(Wi))
 * where:
 * Wi = k / Si  (k = 1, Si = maximum permissible limit)
 * Qi = (|Mi - Ii| / (Si - Ii)) * 100
 */
export function calculateHpi(
  measurements: AnalyteMeasurement[],
  standard: RegulatoryStandard,
  lodStrategy: LODHandlingStrategy = 'half_lod'
): HpiResult {
  let sumWi = 0;
  let sumWiQi = 0;
  const traces: SubIndexTrace[] = [];
  const missingAnalytes: MetalSymbol[] = [];

  for (const m of measurements) {
    const stdLimit = standard.limits[m.symbol];
    if (!stdLimit) {
      missingAnalytes.push(m.symbol);
      continue;
    }

    // Resolve concentration according to qualifier & LOD strategy
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

    // Normalize units: convert measurement unit to standard's unit
    const monitoredConc = convertConcentration(effectiveVal, m.unit, stdLimit.unit);
    const permissibleLimit = stdLimit.permissibleLimit;
    const acceptableLimit = stdLimit.acceptableLimit;
    const idealLimit = stdLimit.idealLimit ?? 0;

    if (permissibleLimit <= 0) {
      continue;
    }

    // Unit weightage Wi inversely proportional to permissible limit (k = 1)
    const Wi = 1.0 / permissibleLimit;

    // Sub-index Qi
    let Qi: number;
    const denominator = permissibleLimit - idealLimit;
    if (denominator > 0) {
      Qi = (Math.abs(monitoredConc - idealLimit) / denominator) * 100;
    } else {
      Qi = (monitoredConc / permissibleLimit) * 100;
    }

    const weightedSubIndex = Wi * Qi;
    sumWi += Wi;
    sumWiQi += weightedSubIndex;

    let status: SubIndexTrace['status'] = 'within_acceptable';
    if (monitoredConc > permissibleLimit) {
      status = 'exceeds_permissible';
    } else if (monitoredConc > acceptableLimit) {
      status = 'within_permissible';
    }

    traces.push({
      symbol: m.symbol,
      monitoredConcentration: roundToPrecision(monitoredConc, 6),
      acceptableLimit,
      permissibleLimit,
      unitWeight: roundToPrecision(Wi, 4),
      subIndex: roundToPrecision(Qi, 4),
      weightedSubIndex: roundToPrecision(weightedSubIndex, 4),
      status,
      notes: stdLimit.notes,
    });
  }

  if (sumWi === 0 || traces.length === 0) {
    throw new Error('Insufficient valid heavy metal measurements matching the selected standard.');
  }

  const rawHpi = sumWiQi / sumWi;
  const hpiValue = roundToPrecision(rawHpi, 2);

  // Standard Prasad & Bose (2001) classification thresholds:
  // HPI < 25: Low pollution
  // 25 <= HPI < 100: Medium / Moderate pollution
  // HPI >= 100: High / Critical threshold pollution
  let classification: HpiResult['classification'] = 'low';
  if (hpiValue >= 100) {
    classification = 'high';
  } else if (hpiValue >= 25) {
    classification = 'medium';
  }

  return {
    value: hpiValue,
    classification,
    thresholdValue: 100,
    traces,
    sumWi: roundToPrecision(sumWi, 4),
    sumWiQi: roundToPrecision(sumWiQi, 4),
    evaluatedAnalytesCount: traces.length,
    missingAnalytes,
  };
}
