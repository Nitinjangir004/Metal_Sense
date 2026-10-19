import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { db } from '../../src/db/store.js';
import path from 'path';
import fs from 'fs';

describe('Sample Entry & File Ingestion Test Suite', () => {
  let userToken: string;
  let workspaceId: string;

  beforeEach(async () => {
    db.reset();

    // Authenticate test user
    const loginRes = await request(app)
      .post('/api/v1/auth/dev-login')
      .send({ email: 'ingest.lead@lab.org', name: 'Dr. Ingest', role: 'owner' });

    userToken = loginRes.body.data.token;
    workspaceId = loginRes.body.data.workspaces[0].id;
  });

  it('GET /api/v1/imports/template.csv returns labeled CSV template with benchmark disclaimer', async () => {
    const res = await request(app).get('/api/v1/imports/template.csv');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.headers['content-disposition']).toContain('attachment');
    expect(res.text).toContain('SampleCode');
    expect(res.text).toContain('fictional benchmark');
  });

  it('POST /api/v1/imports/:ws/csv processes valid CSV and generates deterministic calculations', async () => {
    const validCsv = `SampleCode,CollectionDate,LocationName,Latitude,Longitude,As_mg_L,Pb_mg_L,Cd_mg_L
CSV-WELL-01,2026-03-21T09:00:00Z,Test Borewell Alpha,28.6139,77.2090,0.012,0.008,<0.001
CSV-WELL-02,2026-03-21T10:00:00Z,Test Borewell Beta,28.5355,77.2612,0.045,0.025,0.004`;

    const res = await request(app)
      .post(`/api/v1/imports/${workspaceId}/csv`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ csvText: validCsv, fileName: 'field_test.csv' });

    expect(res.status).toBe(201);
    expect(res.body.data.validCount).toBe(2);
    expect(res.body.data.errorCount).toBe(0);

    const firstSample = res.body.data.createdSamples[0];
    expect(firstSample.sample.sampleCode).toBe('CSV-WELL-01');
    expect(firstSample.analysis.hpi.value).toBeGreaterThan(0);
    expect(firstSample.sample.location.coordinates.latitude).toBe(28.6139);
  });

  it('POST /api/v1/imports/:ws/csv rejects negative concentrations with row-level diagnostics', async () => {
    const invalidCsv = `SampleCode,LocationName,As_mg_L,Pb_mg_L
WELL-VALID,Good Well,0.01,0.01
WELL-INVALID,Bad Well,-0.05,0.02`;

    const res = await request(app)
      .post(`/api/v1/imports/${workspaceId}/csv`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ csvText: invalidCsv });

    expect(res.status).toBe(201);
    expect(res.body.data.validCount).toBe(1);
    expect(res.body.data.errorCount).toBe(1);
    expect(res.body.data.errors[0].message).toContain('negative');
    expect(res.body.data.errors[0].rowNumber).toBe(3);
  });

  it('executes full document extraction and human confirmation pipeline', async () => {
    // 1. Create a dummy test report file
    const dummyPdfPath = path.resolve(process.cwd(), 'uploads', 'test_lab_report.pdf');
    fs.writeFileSync(dummyPdfPath, '%PDF-1.4 dummy test report content');

    // 2. Upload document to initiate extraction job
    const uploadRes = await request(app)
      .post(`/api/v1/imports/${workspaceId}/documents`)
      .set('Authorization', `Bearer ${userToken}`)
      .attach('file', dummyPdfPath);

    expect(uploadRes.status).toBe(202);
    const jobId = uploadRes.body.data.jobId;
    expect(uploadRes.body.data.status).toBe('ready_for_review');
    expect(uploadRes.body.data.proposedData.analytes.length).toBeGreaterThan(0);

    // 3. Poll status of job
    const pollRes = await request(app)
      .get(`/api/v1/imports/${workspaceId}/${jobId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(pollRes.status).toBe(200);
    expect(pollRes.body.data.status).toBe('ready_for_review');

    // 4. Human-in-the-loop confirmation: user submits verified data
    const confirmRes = await request(app)
      .post(`/api/v1/imports/${workspaceId}/${jobId}/confirm`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        sampleCode: 'VERIFIED-LAB-01',
        sampleMatrix: 'groundwater',
        collectionDate: new Date().toISOString(),
        locationName: 'Verified Electroplating Periphery Well',
        district: 'Patparganj',
        measurements: [
          { symbol: 'As', name: 'Arsenic', value: 0.04, unit: 'mg/L', qualifier: '=' },
          { symbol: 'Pb', name: 'Lead', value: 0.02, unit: 'mg/L', qualifier: '=' },
          { symbol: 'Cd', name: 'Cadmium', value: 0.003, unit: 'mg/L', qualifier: '<', detectionLimit: 0.003 },
        ],
      });

    expect(confirmRes.status).toBe(201);
    expect(confirmRes.body.data.sample.sampleCode).toBe('VERIFIED-LAB-01');
    expect(confirmRes.body.data.sample.provenance.method).toBe('ocr_document');
    expect(confirmRes.body.data.sample.provenance.verifiedByUserId).toBeDefined();
    expect(confirmRes.body.data.analysis.hpi.value).toBeGreaterThan(0);

    // Clean up test file
    if (fs.existsSync(dummyPdfPath)) {
      fs.unlinkSync(dummyPdfPath);
    }
  });
});
