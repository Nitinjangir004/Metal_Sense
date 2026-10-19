import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { db } from '../../src/db/store.js';

describe('Auditable Report Generation & Export Integration Tests', () => {
  let userToken: string;
  let workspaceId: string;
  let sampleId: string;

  beforeEach(async () => {
    db.reset();

    // 1. Authenticate user
    const loginRes = await request(app)
      .post('/api/v1/auth/dev-login')
      .send({ email: 'compliance@environmental.gov', name: 'Inspector Roy', role: 'owner' });

    userToken = loginRes.body.data.token;
    workspaceId = loginRes.body.data.workspaces[0].id;

    // 2. Create sample with multiple metals
    const samplePayload = {
      workspaceId,
      projectId: 'proj-default',
      sampleCode: 'REP-TEST-001',
      sampleMatrix: 'groundwater',
      collectionDate: '2026-03-20T10:00:00Z',
      location: {
        id: 'loc-rep-1',
        name: 'Okhla Industrial Deep Borewell',
        code: 'OKH-01',
        coordinates: { latitude: 28.5355, longitude: 77.2731 },
        district: 'South East Delhi',
        state: 'Delhi',
      },
      laboratory: {
        name: 'National Environmental Quality Testing Lab',
        accreditationNumber: 'NABL-ENV-2026-99',
      },
      measurements: [
        { symbol: 'As', name: 'Arsenic', value: 0.05, unit: 'mg/L', qualifier: '=' },
        { symbol: 'Pb', name: 'Lead', value: 0.02, unit: 'mg/L', qualifier: '=' },
        { symbol: 'Cd', name: 'Cadmium', value: 0.005, unit: 'mg/L', qualifier: '=' },
        { symbol: 'Cr', name: 'Chromium', value: 0.08, unit: 'mg/L', qualifier: '=' },
      ],
      provenance: { method: 'manual', isDemo: false },
    };

    const sampleRes = await request(app)
      .post(`/api/v1/workspaces/${workspaceId}/samples`)
      .set('Authorization', `Bearer ${userToken}`)
      .send(samplePayload);

    sampleId = sampleRes.body.data.sample.id;
  });

  it('exports RFC-4180 CSV matrix with headers, sample metadata, and calculated indices', async () => {
    const res = await request(app)
      .get(`/api/v1/workspaces/${workspaceId}/reports/csv`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.headers['content-disposition']).toContain('attachment');
    expect(res.text).toContain('Sample ID,Sample Code');
    expect(res.text).toContain('HPI Value,HPI Classification');
    expect(res.text).toContain('REP-TEST-001');
    expect(res.text).toContain('Okhla Industrial Deep Borewell');
  });

  it('generates high-resolution PDF compliance dossier with valid PDF magic bytes (%PDF)', async () => {
    const res = await request(app)
      .get(`/api/v1/workspaces/${workspaceId}/reports/pdf`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('application/pdf');
    expect(res.headers['content-disposition']).toContain('.pdf');

    // Verify binary magic header of a valid PDF document (%PDF)
    const magic = res.body.toString('utf-8', 0, 4);
    expect(magic).toBe('%PDF');
    expect(res.body.length).toBeGreaterThan(1000);
  });

  it('generates focused single-sample PDF report dossier with calculation traces', async () => {
    const res = await request(app)
      .get(`/api/v1/workspaces/${workspaceId}/samples/${sampleId}/reports/pdf`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('application/pdf');
    expect(res.headers['content-disposition']).toContain('REP-TEST-001');

    const magic = res.body.toString('utf-8', 0, 4);
    expect(magic).toBe('%PDF');
  });

  it('prevents cross-tenant unauthorized access to workspace reports', async () => {
    // Login User B (different workspace)
    const userBLogin = await request(app)
      .post('/api/v1/auth/dev-login')
      .send({ email: 'stranger@otherlab.com', name: 'Other User' });

    const tokenB = userBLogin.body.data.token;

    // User B attempts to access Workspace A report
    const res = await request(app)
      .get(`/api/v1/workspaces/${workspaceId}/reports/csv`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Forbidden');
  });
});
