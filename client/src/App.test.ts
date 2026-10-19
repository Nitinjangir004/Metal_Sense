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
});
