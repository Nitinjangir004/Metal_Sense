import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { db } from '../../src/db/store.js';

describe('Phase 1 — Persistence, Summary & Sample Query Test Suite', () => {
  let userToken: string;
  let workspaceId: string;

  beforeEach(async () => {
    await db.reset();

    // Authenticate test owner
    const loginRes = await request(app)
      .post('/api/v1/auth/dev-login')
      .send({ email: 'lab.lead@env-audit.org', name: 'Dr. Persist', role: 'owner' });

    userToken = loginRes.body.data.token;
    workspaceId = loginRes.body.data.workspaces[0].id;
  });

  it('GET /api/v1/workspaces/:ws/summary returns 0 counts on clean workspace', async () => {
    const res = await request(app)
      .get(`/api/v1/workspaces/${workspaceId}/summary`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.totalSamples).toBe(0);
    expect(res.body.data.criticalCount).toBe(0);
    expect(res.body.data.moderateCount).toBe(0);
    expect(res.body.data.safeCount).toBe(0);
    expect(res.body.data.latestSamples).toHaveLength(0);
  });

  it('calculates live summary metrics, category distribution and top exceeded metals', async () => {
    // 1. Create a Critical Sample (elevated Lead and Cadmium)
    await request(app)
      .post(`/api/v1/workspaces/${workspaceId}/samples`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        workspaceId,
        projectId: 'proj-default',
        sampleCode: 'TEST-CRIT-01',
        sampleMatrix: 'groundwater',
        collectionDate: '2026-03-25T10:00:00Z',
        location: {
          id: 'loc-1',
          name: 'Industrial Zone Well',
          code: 'LOC-1',
          coordinates: { latitude: 28.53, longitude: 77.27 },
        },
        measurements: [
          { symbol: 'Pb', name: 'Lead', value: 0.05, unit: 'mg/L', qualifier: '=' },
          { symbol: 'Cd', name: 'Cadmium', value: 0.01, unit: 'mg/L', qualifier: '=' },
        ],
        provenance: { method: 'manual', isDemo: false },
      });

    // 2. Create a Pristine Sample without coordinates (tests missingLocationCount)
    await request(app)
      .post(`/api/v1/workspaces/${workspaceId}/samples`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        workspaceId,
        projectId: 'proj-default',
        sampleCode: 'TEST-SAFE-01',
        sampleMatrix: 'drinking_water',
        collectionDate: '2026-03-26T10:00:00Z',
        location: {
          id: 'loc-2',
          name: 'Remote Mountain Spring',
          code: 'LOC-2',
        },
        measurements: [
          { symbol: 'Pb', name: 'Lead', value: 0.001, unit: 'mg/L', qualifier: '<' },
          { symbol: 'Cd', name: 'Cadmium', value: 0.0005, unit: 'mg/L', qualifier: '<' },
        ],
        provenance: { method: 'manual', isDemo: false },
      });

    // Check summary
    const summaryRes = await request(app)
      .get(`/api/v1/workspaces/${workspaceId}/summary`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(summaryRes.status).toBe(200);
    const summary = summaryRes.body.data;
    expect(summary.totalSamples).toBe(2);
    expect(summary.criticalCount).toBe(1);
    expect(summary.safeCount).toBe(1);
    expect(summary.missingLocationCount).toBe(1);
    expect(summary.latestSamples).toHaveLength(2);
    expect(summary.topExceededMetals.length).toBeGreaterThan(0);
  });

  it('GET /api/v1/workspaces/:ws/samples supports search, category filtering and pagination', async () => {
    // Ingest sample
    await request(app)
      .post(`/api/v1/workspaces/${workspaceId}/samples`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        workspaceId,
        projectId: 'proj-default',
        sampleCode: 'SEARCH-ME-99',
        sampleMatrix: 'groundwater',
        collectionDate: '2026-03-20T10:00:00Z',
        location: { id: 'loc-3', name: 'Unique Oasis Station', code: 'LOC-3' },
        measurements: [{ symbol: 'Fe', name: 'Iron', value: 0.1, unit: 'mg/L', qualifier: '=' }],
        provenance: { method: 'manual', isDemo: false },
      });

    // Search query matches
    const searchMatch = await request(app)
      .get(`/api/v1/workspaces/${workspaceId}/samples?search=Oasis`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(searchMatch.status).toBe(200);
    expect(searchMatch.body.data).toHaveLength(1);
    expect(searchMatch.body.data[0].sampleCode).toBe('SEARCH-ME-99');
    expect(searchMatch.body.data[0].analysis).toBeDefined();

    // Search query misses
    const searchMiss = await request(app)
      .get(`/api/v1/workspaces/${workspaceId}/samples?search=NonExistentTerm`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(searchMiss.status).toBe(200);
    expect(searchMiss.body.data).toHaveLength(0);
    expect(searchMiss.body.meta.total).toBe(0);
  });

  it('PATCH and DELETE /api/v1/workspaces/:ws/samples/:sampleId updates and deletes samples', async () => {
    const createRes = await request(app)
      .post(`/api/v1/workspaces/${workspaceId}/samples`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        workspaceId,
        projectId: 'proj-default',
        sampleCode: 'MUTABLE-01',
        sampleMatrix: 'groundwater',
        collectionDate: '2026-03-20T10:00:00Z',
        location: { id: 'loc-4', name: 'Old Well Name', code: 'LOC-4' },
        measurements: [{ symbol: 'Zn', name: 'Zinc', value: 1.0, unit: 'mg/L', qualifier: '=' }],
        provenance: { method: 'manual', isDemo: false },
      });

    const sampleId = createRes.body.data.sample.id;

    // Patch location name and notes
    const patchRes = await request(app)
      .patch(`/api/v1/workspaces/${workspaceId}/samples/${sampleId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        location: { name: 'Renamed Verified Aquifer' },
        notes: 'Updated field notes by auditor',
      });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.data.location.name).toBe('Renamed Verified Aquifer');
    expect(patchRes.body.data.notes).toBe('Updated field notes by auditor');

    // Delete sample
    const deleteRes = await request(app)
      .delete(`/api/v1/workspaces/${workspaceId}/samples/${sampleId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(deleteRes.status).toBe(200);

    // Verify subsequent get returns 404
    const getRes = await request(app)
      .get(`/api/v1/workspaces/${workspaceId}/samples/${sampleId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(getRes.status).toBe(404);
  });

  it('ensures Mongoose models generate _id automatically preventing document must have an _id before saving error', async () => {
    const {
      UserModel,
      WorkspaceModel,
      ProjectModel,
      SampleModel,
      AnalysisRunModel,
      ExtractionJobModel,
      AuditEventModel,
    } = await import('../../src/db/models/index.js');

    const userDoc = new UserModel({
      id: 'usr-test-model',
      email: 'test-model@metalsense.test',
      name: 'Model Tester',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    expect(userDoc._id).toBeDefined();

    const wsDoc = new WorkspaceModel({
      id: 'ws-test-model',
      name: 'Test WS',
      slug: 'test-ws',
      ownerId: 'usr-test-model',
      members: [{ userId: 'usr-test-model', role: 'owner' }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    expect(wsDoc._id).toBeDefined();

    const projDoc = new ProjectModel({
      id: 'proj-test-model',
      workspaceId: 'ws-test-model',
      name: 'Test Proj',
      createdAt: new Date().toISOString(),
    });
    expect(projDoc._id).toBeDefined();

    const sampleDoc = new SampleModel({
      id: 'smp-test-model',
      workspaceId: 'ws-test-model',
      projectId: 'proj-test-model',
      sampleCode: 'SMP-01',
      sampleMatrix: 'groundwater',
      collectionDate: new Date().toISOString(),
      location: { id: 'l1', name: 'L1', code: 'LOC-1' },
      measurements: [],
      provenance: { method: 'manual' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    expect(sampleDoc._id).toBeDefined();

    const analysisDoc = new AnalysisRunModel({
      id: 'run-test-model',
      sampleId: 'smp-test-model',
      workspaceId: 'ws-test-model',
      timestamp: new Date().toISOString(),
      calculationVersion: '1.0.0',
      standardUsed: { code: 'BIS_10500_2012', version: '2012', citation: 'BIS' },
      lodStrategy: 'half_lod',
      normalizedUnit: 'mg/L',
      hpi: { score: 10, classification: 'low' },
      hei: { score: 1, classification: 'low' },
      cd: { score: 0, classification: 'low' },
      overallPollutionCategory: 'low',
      auditTrail: { formulaVersion: '1.0.0', calculatedAt: new Date().toISOString(), engineVersion: '1.0.0' },
    });
    expect(analysisDoc._id).toBeDefined();

    const jobDoc = new ExtractionJobModel({
      id: 'job-test-model',
      workspaceId: 'ws-test-model',
      userId: 'usr-test-model',
      originalFileName: 'test.csv',
      fileKey: 'key',
      mimeType: 'text/csv',
      sizeBytes: 100,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
    expect(jobDoc._id).toBeDefined();

    const auditDoc = new AuditEventModel({
      id: 'aud-test-model',
      workspaceId: 'ws-test-model',
      userId: 'usr-test-model',
      action: 'TEST',
      targetType: 'user',
      targetId: 'usr-test-model',
      timestamp: new Date().toISOString(),
    });
    expect(auditDoc._id).toBeDefined();
  });
});
