import { describe, it, expect } from 'vitest';
import { DEMO_SAMPLES, DEMO_ANALYSES } from './data/demoSamples';

describe('Client Benchmark & Route Integrity', () => {
  it('loads demo samples with verified structures', () => {
    expect(DEMO_SAMPLES.length).toBeGreaterThanOrEqual(3);
    for (const sample of DEMO_SAMPLES) {
      expect(sample.sampleCode).toBeDefined();
      expect(sample.location.name).toBeDefined();
      expect(sample.measurements.length).toBeGreaterThan(0);
      expect(sample.provenance.isDemo).toBe(true);
    }
  });

  it('matches demo sample IDs to pre-calculated analyses', () => {
    for (const sample of DEMO_SAMPLES) {
      const analysis = DEMO_ANALYSES[sample.id];
      expect(analysis).toBeDefined();
      expect(analysis.hpi.value).toBeGreaterThan(0);
      expect(analysis.standardUsed.code).toBe('BIS_10500_2012');
    }
  });

  it('verifies that industrial well GW-IND-2026-01 exceeds critical threshold', () => {
    const analysis = DEMO_ANALYSES['demo-sample-001'];
    expect(analysis.hpi.value).toBeGreaterThanOrEqual(100);
    expect(analysis.overallPollutionCategory).toBe('High Pollution');
    expect(analysis.exceededAnalytes.length).toBeGreaterThanOrEqual(2);
  });

  it('validates agricultural well GW-AGR-2026-04 is classified as medium pollution', () => {
    const analysis = DEMO_ANALYSES['demo-sample-002'];
    expect(analysis.hpi.value).toBe(38.6);
    expect(analysis.hpi.classification).toBe('medium');
    expect(analysis.exceededAnalytes.length).toBe(0);
  });

  it('validates deep municipal borewell GW-RES-2026-03 is classified as low pollution', () => {
    const analysis = DEMO_ANALYSES['demo-sample-003'];
    expect(analysis.hpi.value).toBe(14.2);
    expect(analysis.hpi.value).toBeLessThan(25);
    expect(analysis.hpi.classification).toBe('low');
  });
});
