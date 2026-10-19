import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';

describe('Server API Endpoints', () => {
  it('GET /api/v1/health returns 200 OK and valid status info', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toContain('MetalSense');
    expect(res.headers['x-request-id']).toBeDefined();
  });

  it('GET /api/v1/standards returns registered standards', async () => {
    const res = await request(app).get('/api/v1/standards');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    const bis = res.body.data.find((s: { code: string }) => s.code === 'BIS_10500_2012');
    expect(bis).toBeDefined();
    expect(bis.jurisdiction).toBe('India');
  });

  it('GET /api/v1/demo/samples returns benchmark datasets with deterministic calculations', async () => {
    const res = await request(app).get('/api/v1/demo/samples');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(3);

    const first = res.body.data[0];
    expect(first.sample.sampleCode).toBe('GW-IND-2026-01');
    expect(first.analysis.hpi.value).toBeGreaterThan(100);
  });
});
