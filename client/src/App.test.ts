import { describe, it, expect } from 'vitest';
import { ApiError } from './lib/api';
import { BIS_10500_2012, WHO_GDWQ_4TH_ED, CANONICAL_METALS } from '@metalsense/shared';

describe('Client Configuration & Standards Verification', () => {
  it('correctly instantiates typed ApiError with status and message', () => {
    const error = new ApiError('Workspace not found', 404, { detail: 'missing' });
    expect(error.name).toBe('ApiError');
    expect(error.message).toBe('Workspace not found');
    expect(error.status).toBe(404);
    expect(error.data).toEqual({ detail: 'missing' });
  });

  it('validates canonical heavy metal specifications in client bundle', () => {
    const symbols = Object.keys(CANONICAL_METALS);
    expect(symbols).toContain('As');
    expect(symbols).toContain('Pb');
    expect(symbols).toContain('Cd');
    expect(symbols).toContain('Cr');
    expect(symbols).toContain('Cu');
    expect(symbols).toContain('Fe');
    expect(symbols).toContain('Mn');
    expect(symbols).toContain('Ni');
    expect(symbols).toContain('Zn');

    expect(CANONICAL_METALS.As.name).toBe('Arsenic');
    expect(CANONICAL_METALS.Pb.atomicMass).toBe(207.2);
    expect(CANONICAL_METALS.Pb.atomicNumber).toBe(82);
  });

  it('verifies BIS IS 10500:2012 drinking water standards limits', () => {
    expect(BIS_10500_2012.code).toBe('BIS_10500_2012');
    expect(BIS_10500_2012.jurisdiction).toBe('India');
    expect(BIS_10500_2012.limits.As.permissibleLimit).toBe(0.05);
    expect(BIS_10500_2012.limits.Pb.permissibleLimit).toBe(0.01);
    expect(BIS_10500_2012.limits.Cd.permissibleLimit).toBe(0.003);
  });

  it('verifies WHO Guidelines for Drinking-water Quality 4th Ed limits', () => {
    expect(WHO_GDWQ_4TH_ED.code).toBe('WHO_GDWQ_4TH');
    expect(WHO_GDWQ_4TH_ED.jurisdiction).toBe('International_WHO');
    expect(WHO_GDWQ_4TH_ED.limits.As.permissibleLimit).toBe(0.01);
    expect(WHO_GDWQ_4TH_ED.limits.Pb.permissibleLimit).toBe(0.01);
  });
});
