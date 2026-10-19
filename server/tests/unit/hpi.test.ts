import { describe, it, expect } from 'vitest';
import { calculateHpi } from '../../src/services/calculation/hpi.js';
import { calculateHei } from '../../src/services/calculation/hei.js';
import { calculateCd } from '../../src/services/calculation/cd.js';
import { BIS_10500_2012, AnalyteMeasurement } from '@metalsense/shared';

describe('Deterministic Pollution Index Calculations', () => {
  const pristineSample: AnalyteMeasurement[] = [
    { symbol: 'As', name: 'Arsenic', value: 0.002, unit: 'mg/L', qualifier: '<', detectionLimit: 0.002 },
    { symbol: 'Pb', name: 'Lead', value: 0.002, unit: 'mg/L', qualifier: '<', detectionLimit: 0.002 },
    { symbol: 'Cd', name: 'Cadmium', value: 0.0005, unit: 'mg/L', qualifier: '<', detectionLimit: 0.0005 },
    { symbol: 'Fe', name: 'Iron', value: 0.1, unit: 'mg/L', qualifier: '=' },
    { symbol: 'Zn', name: 'Zinc', value: 0.5, unit: 'mg/L', qualifier: '=' },
  ];

  const pollutedSample: AnalyteMeasurement[] = [
    { symbol: 'As', name: 'Arsenic', value: 0.06, unit: 'mg/L', qualifier: '=' }, // > 0.05
    { symbol: 'Pb', name: 'Lead', value: 0.03, unit: 'mg/L', qualifier: '=' }, // > 0.01
    { symbol: 'Cd', name: 'Cadmium', value: 0.006, unit: 'mg/L', qualifier: '=' }, // > 0.003
    { symbol: 'Cr', name: 'Chromium', value: 0.08, unit: 'mg/L', qualifier: '=' }, // > 0.05
  ];

  it('calculates HPI for pristine water below threshold (HPI < 25)', () => {
    const result = calculateHpi(pristineSample, BIS_10500_2012, 'half_lod');
    expect(result.value).toBeLessThan(25);
    expect(result.classification).toBe('low');
    expect(result.traces.length).toBe(5);
  });

  it('calculates HPI for contaminated water exceeding threshold (HPI >= 100)', () => {
    const result = calculateHpi(pollutedSample, BIS_10500_2012, 'half_lod');
    expect(result.value).toBeGreaterThanOrEqual(100);
    expect(result.classification).toBe('high');
  });

  it('calculates HEI deterministically and classifies correctly', () => {
    const pristineHei = calculateHei(pristineSample, BIS_10500_2012, 'half_lod');
    expect(pristineHei.value).toBeLessThan(10);
    expect(pristineHei.classification).toBe('low');

    const pollutedHei = calculateHei(pollutedSample, BIS_10500_2012, 'half_lod');
    expect(pollutedHei.value).toBeGreaterThan(5);
  });

  it('calculates Cd (Degree of Contamination) deterministically', () => {
    const pristineCd = calculateCd(pristineSample, BIS_10500_2012, 'half_lod');
    expect(pristineCd.classification).toBe('low');

    const pollutedCd = calculateCd(pollutedSample, BIS_10500_2012, 'half_lod');
    expect(pollutedCd.value).toBeGreaterThan(1);
  });
});
