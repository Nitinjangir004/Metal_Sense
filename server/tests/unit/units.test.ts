import { describe, it, expect } from 'vitest';
import { convertConcentration, roundToPrecision } from '@metalsense/shared';

describe('Unit Conversion Service', () => {
  it('converts mg/L to ug/L correctly', () => {
    expect(convertConcentration(0.01, 'mg/L', 'ug/L')).toBe(10);
    expect(convertConcentration(1.5, 'mg/L', 'ug/L')).toBe(1500);
  });

  it('converts ug/L to mg/L correctly', () => {
    expect(convertConcentration(10, 'ug/L', 'mg/L')).toBe(0.01);
    expect(convertConcentration(50, 'ug/L', 'mg/L')).toBe(0.05);
  });

  it('handles equivalent units (ppm and ppb)', () => {
    expect(convertConcentration(1, 'ppm', 'mg/L')).toBe(1);
    expect(convertConcentration(100, 'ppb', 'ug/L')).toBe(100);
    expect(convertConcentration(1, 'ppm', 'ug/L')).toBe(1000);
  });

  it('rejects negative concentrations', () => {
    expect(() => convertConcentration(-0.5, 'mg/L', 'ug/L')).toThrow();
  });

  it('rounds to specified precision accurately', () => {
    expect(roundToPrecision(0.1234567, 2)).toBe(0.12);
    expect(roundToPrecision(0.1234567, 4)).toBe(0.1235);
  });
});
