import { describe, it, expect } from 'vitest';
import { calculateHpi } from '../../src/services/calculation/hpi.js';
import { calculateHei } from '../../src/services/calculation/hei.js';
import { calculateCd } from '../../src/services/calculation/cd.js';
import {
  BIS_10500_2012,
  WHO_GDWQ_4TH_ED,
  AnalyteMeasurement,
  convertConcentration,
} from '@metalsense/shared';

describe('Authoritative Worked Examples & Mathematical Invariants', () => {
  it('MATHEMATICAL BOUNDARY INVARIANT: When all metals are at exact permissible limits, HPI must equal 100', () => {
    // If every metal Mi = Si, then Qi = (Si / Si) * 100 = 100
    // Then HPI = (sum(Wi * 100)) / sum(Wi) = 100 * sum(Wi) / sum(Wi) = 100.00
    const boundaryMeasurements: AnalyteMeasurement[] = [
      { symbol: 'As', name: 'Arsenic', value: 0.05, unit: 'mg/L', qualifier: '=' },
      { symbol: 'Pb', name: 'Lead', value: 0.01, unit: 'mg/L', qualifier: '=' },
      { symbol: 'Cd', name: 'Cadmium', value: 0.003, unit: 'mg/L', qualifier: '=' },
      { symbol: 'Cr', name: 'Chromium', value: 0.05, unit: 'mg/L', qualifier: '=' },
      { symbol: 'Fe', name: 'Iron', value: 1.0, unit: 'mg/L', qualifier: '=' },
      { symbol: 'Cu', name: 'Copper', value: 1.5, unit: 'mg/L', qualifier: '=' },
    ];

    const result = calculateHpi(boundaryMeasurements, BIS_10500_2012, 'half_lod');
    expect(result.value).toBe(100);
    expect(result.classification).toBe('high');
  });

  it('MATHEMATICAL BOUNDARY INVARIANT: When all metals are at exact permissible limits, HEI equals the number of analytes', () => {
    // If every metal Mi = Hmac, then ratio = 1, so sum(ratio) = n = 4
    const boundaryMeasurements: AnalyteMeasurement[] = [
      { symbol: 'As', name: 'Arsenic', value: 0.05, unit: 'mg/L', qualifier: '=' },
      { symbol: 'Pb', name: 'Lead', value: 0.01, unit: 'mg/L', qualifier: '=' },
      { symbol: 'Cd', name: 'Cadmium', value: 0.003, unit: 'mg/L', qualifier: '=' },
      { symbol: 'Cr', name: 'Chromium', value: 0.05, unit: 'mg/L', qualifier: '=' },
    ];

    const hei = calculateHei(boundaryMeasurements, BIS_10500_2012, 'half_lod');
    expect(hei.value).toBe(4.0);
  });

  it('UNIT INVARIANCE: Concentration inputs in ug/L and mg/L yield identical index scores', () => {
    // Sample A in mg/L
    const sampleInMgL: AnalyteMeasurement[] = [
      { symbol: 'As', name: 'Arsenic', value: 0.02, unit: 'mg/L', qualifier: '=' },
      { symbol: 'Pb', name: 'Lead', value: 0.008, unit: 'mg/L', qualifier: '=' },
      { symbol: 'Cr', name: 'Chromium', value: 0.03, unit: 'mg/L', qualifier: '=' },
    ];

    // Sample B identical concentrations in ug/L
    const sampleInUgL: AnalyteMeasurement[] = [
      { symbol: 'As', name: 'Arsenic', value: 20, unit: 'ug/L', qualifier: '=' },
      { symbol: 'Pb', name: 'Lead', value: 8, unit: 'ug/L', qualifier: '=' },
      { symbol: 'Cr', name: 'Chromium', value: 30, unit: 'ug/L', qualifier: '=' },
    ];

    const hpiA = calculateHpi(sampleInMgL, BIS_10500_2012, 'half_lod');
    const hpiB = calculateHpi(sampleInUgL, BIS_10500_2012, 'half_lod');

    expect(hpiA.value).toBe(hpiB.value);
    expect(hpiA.traces[0].monitoredConcentration).toBe(hpiB.traces[0].monitoredConcentration);
  });

  it('LOD STRATEGY TRANSPARENCY: Verifies zero, half-LOD, and full-LOD substitutions', () => {
    const lodSample: AnalyteMeasurement[] = [
      { symbol: 'As', name: 'Arsenic', value: 0.01, unit: 'mg/L', qualifier: '<', detectionLimit: 0.01 },
      { symbol: 'Pb', name: 'Lead', value: 0.01, unit: 'mg/L', qualifier: '<', detectionLimit: 0.01 },
    ];

    const zeroRes = calculateHpi(lodSample, BIS_10500_2012, 'zero');
    const halfRes = calculateHpi(lodSample, BIS_10500_2012, 'half_lod');
    const fullRes = calculateHpi(lodSample, BIS_10500_2012, 'full_lod');

    // With zero substitution: Mi = 0 -> HPI is 0
    expect(zeroRes.value).toBe(0);

    // With half-LOD: Mi = 0.005 -> HPI is positive but less than full-LOD
    expect(halfRes.value).toBeGreaterThan(0);
    expect(halfRes.value).toBeLessThan(fullRes.value);

    // With full-LOD: Mi = 0.01 -> HPI is highest
    expect(fullRes.value).toBeGreaterThan(halfRes.value);
  });

  it('STANDARD SENSITIVITY: Comparing against WHO vs BIS standards yields distinct statutory ratios', () => {
    // Nickel has 0.02 mg/L limit in BIS 10500:2012, but 0.07 mg/L in WHO Guidelines
    const sample: AnalyteMeasurement[] = [
      { symbol: 'Ni', name: 'Nickel', value: 0.035, unit: 'mg/L', qualifier: '=' },
    ];

    const bisHei = calculateHei(sample, BIS_10500_2012, 'half_lod');
    const whoHei = calculateHei(sample, WHO_GDWQ_4TH_ED, 'half_lod');

    // In BIS: 0.035 / 0.02 = 1.75 (> 1.0, exceeds permissible)
    expect(bisHei.traces[0].ratio).toBe(1.75);

    // In WHO: 0.035 / 0.07 = 0.50 (within WHO guideline)
    expect(whoHei.traces[0].ratio).toBe(0.5);
  });

  it('ERROR EXPLANATION: Throws informative error when no matching standard limits exist', () => {
    const unsupportedSample: AnalyteMeasurement[] = [
      // @ts-expect-error testing invalid element
      { symbol: 'Xx', name: 'Unrecognized Element', value: 1.0, unit: 'mg/L', qualifier: '=' },
    ];

    expect(() => calculateHpi(unsupportedSample, BIS_10500_2012, 'half_lod')).toThrow(
      /Insufficient valid heavy metal measurements/
    );
  });
});
