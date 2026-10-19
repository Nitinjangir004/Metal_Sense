import {
  Sample,
  RegulatoryStandard,
  AnalysisRun,
  LODHandlingStrategy,
  ConcentrationUnit,
  convertConcentration,
  roundToPrecision,
} from '@metalsense/shared';
import { calculateHpi } from './hpi.js';
import { calculateHei } from './hei.js';
import { calculateCd } from './cd.js';
import crypto from 'crypto';

export interface CalculationOptions {
  standard: RegulatoryStandard;
  lodStrategy?: LODHandlingStrategy;
  normalizedUnit?: ConcentrationUnit;
}

export function calculateSampleIndices(
  sample: Sample,
  options: CalculationOptions
): AnalysisRun {
  const { standard, lodStrategy = 'half_lod', normalizedUnit = 'mg/L' } = options;

  const hpi = calculateHpi(sample.measurements, standard, lodStrategy);
  const hei = calculateHei(sample.measurements, standard, lodStrategy);
  const cd = calculateCd(sample.measurements, standard, lodStrategy);

  // Exceeded analytes
  const exceededAnalytes: AnalysisRun['exceededAnalytes'] = [];
  for (const m of sample.measurements) {
    const limit = standard.limits[m.symbol];
    if (!limit) continue;

    const monitored = convertConcentration(m.value, m.unit, limit.unit);
    if (monitored > limit.permissibleLimit) {
      exceededAnalytes.push({
        symbol: m.symbol,
        monitored: roundToPrecision(monitored, 4),
        permissible: limit.permissibleLimit,
        ratio: roundToPrecision(monitored / limit.permissibleLimit, 2),
      });
    }
  }

  // Determine overall category
  let overallPollutionCategory: AnalysisRun['overallPollutionCategory'] = 'Low Pollution';
  if (hpi.value >= 100 || exceededAnalytes.length >= 2) {
    overallPollutionCategory = 'High Pollution';
  } else if (hpi.value >= 25 || exceededAnalytes.length === 1) {
    overallPollutionCategory = 'Moderate Pollution';
  }

  return {
    id: `analysis-${crypto.randomUUID()}`,
    sampleId: sample.id,
    workspaceId: sample.workspaceId,
    timestamp: new Date().toISOString(),
    calculationVersion: '1.0.0-deterministic',
    standardUsed: {
      code: standard.code,
      version: standard.version,
      citation: standard.citation,
    },
    lodStrategy,
    normalizedUnit,
    hpi,
    hei,
    cd,
    overallPollutionCategory,
    exceededAnalytes,
    auditTrail: {
      formulaVersion: 'HPI_Mohan_1996_HEI_Edet_2002_Cd_Backman_1998',
      calculatedAt: new Date().toISOString(),
      engineVersion: 'metalsense-calc-engine-v1.0.0',
    },
  };
}

export { calculateHpi, calculateHei, calculateCd };
