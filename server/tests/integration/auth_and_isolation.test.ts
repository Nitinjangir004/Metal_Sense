import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { db } from '../../src/db/store.js';

describe('Authentication & Multi-Tenant SaaS Isolation Tests', () => {
  beforeEach(() => {
    db.reset();
  });

  it('rejects unauthenticated requests to protected routes with 401', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error).toContain('Authentication required');
  });

  it('authenticates user and returns session cookie and workspace', async () => {
    const res = await request(app)
      .post('/api/v1/auth/dev-login')
      .send({ email: 'user.a@lab.org', name: 'Alice Researcher', role: 'owner' });

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe('user.a@lab.org');
    expect(res.body.data.token).toBeDefined();
    expect(res.headers['set-cookie']).toBeDefined();

    // Verify /me works with the cookie
    const cookie = res.headers['set-cookie'];
    const meRes = await request(app).get('/api/v1/auth/me').set('Cookie', cookie);
    expect(meRes.status).toBe(200);
    expect(meRes.body.data.user.email).toBe('user.a@lab.org');
  });

  it('ENFORCES CROSS-TENANT ISOLATION: User B cannot access User A records', async () => {
    // 1. User A logs in and gets their workspace
    const userALogin = await request(app)
      .post('/api/v1/auth/dev-login')
      .send({ email: 'alice@lab-a.org', name: 'Alice A' });
    const tokenA = userALogin.body.data.token;
    const wsA = userALogin.body.data.workspaces[0].id;

    // 2. User A creates a sample in Workspace A
    const samplePayload = {
      workspaceId: wsA,
      projectId: 'proj-default',
      sampleCode: 'ALICE-GW-01',
      sampleMatrix: 'groundwater',
      collectionDate: new Date().toISOString(),
      location: {
        id: 'loc-alice-1',
        name: 'Alice Private Well',
        code: 'W-01',
      },
      measurements: [
        { symbol: 'As', name: 'Arsenic', value: 0.02, unit: 'mg/L', qualifier: '=' },
        { symbol: 'Pb', name: 'Lead', value: 0.015, unit: 'mg/L', qualifier: '=' },
      ],
      provenance: { method: 'manual', isDemo: false },
    };

    const createSampleRes = await request(app)
      .post(`/api/v1/workspaces/${wsA}/samples`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send(samplePayload);
    expect(createSampleRes.status).toBe(201);
    const sampleAId = createSampleRes.body.data.sample.id;

    // 3. User B logs in (has distinct Workspace B)
    const userBLogin = await request(app)
      .post('/api/v1/auth/dev-login')
      .send({ email: 'bob@competitor-lab.org', name: 'Bob B' });
    const tokenB = userBLogin.body.data.token;
    const wsB = userBLogin.body.data.workspaces[0].id;

    expect(wsA).not.toBe(wsB);

    // 4. User B attempts to read User A's samples list -> MUST BE 403 FORBIDDEN
    const crossListRes = await request(app)
      .get(`/api/v1/workspaces/${wsA}/samples`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect(crossListRes.status).toBe(403);
    expect(crossListRes.body.error).toContain('Forbidden');

    // 5. User B attempts to directly read User A's specific sample -> MUST BE 403 FORBIDDEN
    const crossSampleRes = await request(app)
      .get(`/api/v1/workspaces/${wsA}/samples/${sampleAId}`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect(crossSampleRes.status).toBe(403);
    expect(crossSampleRes.body.error).toContain('Forbidden');

    // 6. User B lists their OWN workspace samples -> receives empty array, not User A data
    const bobSamplesRes = await request(app)
      .get(`/api/v1/workspaces/${wsB}/samples`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect(bobSamplesRes.status).toBe(200);
    expect(bobSamplesRes.body.data).toEqual([]);
  });

  it('ENFORCES ROLE-BASED ACCESS CONTROL (RBAC): Viewer role cannot create samples', async () => {
    // 1. Owner creates workspace
    const ownerLogin = await request(app)
      .post('/api/v1/auth/dev-login')
      .send({ email: 'owner@lab.org', name: 'Lab Owner' });
    const wsId = ownerLogin.body.data.workspaces[0].id;

    // 2. Add Viewer User to that workspace
    const viewerLogin = await request(app)
      .post('/api/v1/auth/dev-login')
      .send({ email: 'auditor@external.org', name: 'External Auditor' });
    const viewerId = viewerLogin.body.data.user.id;
    const viewerToken = viewerLogin.body.data.token;

    db.addWorkspaceMember(wsId, viewerId, 'viewer');

    // 3. Viewer attempts to read -> Allowed (200)
    const readRes = await request(app)
      .get(`/api/v1/workspaces/${wsId}/samples`)
      .set('Authorization', `Bearer ${viewerToken}`);
    expect(readRes.status).toBe(200);

    // 4. Viewer attempts to create sample -> DENIED (403 Insufficient permissions)
    const writeRes = await request(app)
      .post(`/api/v1/workspaces/${wsId}/samples`)
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({
        sampleCode: 'AUDIT-FAIL-01',
        sampleMatrix: 'groundwater',
        collectionDate: new Date().toISOString(),
        location: { id: 'l1', name: 'Well', code: 'W1' },
        measurements: [{ symbol: 'As', name: 'Arsenic', value: 0.01, unit: 'mg/L', qualifier: '=' }],
        provenance: { method: 'manual', isDemo: false },
      });

    expect(writeRes.status).toBe(403);
    expect(writeRes.body.error).toContain('Insufficient permissions');
  });

  it('logs out and invalidates cookie session', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/dev-login')
      .send({ email: 'test@logout.org', name: 'Logout User' });
    const cookie = loginRes.headers['set-cookie'];

    const logoutRes = await request(app)
      .post('/api/v1/auth/logout')
      .set('Cookie', cookie);
    expect(logoutRes.status).toBe(200);

    // Cookie set in logout header is cleared/expired
    const clearedCookie = logoutRes.headers['set-cookie'][0];
    expect(clearedCookie).toMatch(/metalsense_session=;/);
  });
});
