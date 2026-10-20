import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';

describe('Real Authentication Endpoints', () => {
  const testEmail = 'researcher.auth@metalsense.test';
  const testPassword = 'SecureLaboratoryPassword2026!';
  let sessionCookie: string;
  let userToken: string;

  it('POST /api/v1/auth/signup - creates user and workspace, returns token and session cookie', async () => {
    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        name: 'Dr. Aris Thorne',
        email: testEmail,
        password: testPassword,
        workspaceName: 'Thorne Hydrology Lab',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.user.email).toBe(testEmail);
    expect(res.body.data.user.passwordHash).toBeUndefined(); // never expose passwordHash
    expect(res.body.data.workspaces).toHaveLength(1);
    expect(res.body.data.workspaces[0].name).toBe('Thorne Hydrology Lab');
    expect(res.body.data.token).toBeDefined();

    // Check session cookie
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies[0]).toContain('metalsense_session=');

    sessionCookie = cookies[0].split(';')[0];
    userToken = res.body.data.token;
  });

  it('POST /api/v1/auth/signup - rejects duplicate email with 409', async () => {
    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        name: 'Duplicate Aris',
        email: testEmail,
        password: 'AnotherPassword123!',
      });

    expect(res.status).toBe(409);
    expect(res.body.error).toContain('already exists');
  });

  it('POST /api/v1/auth/signup - rejects short password (<10 chars) with 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        name: 'Short Password User',
        email: 'short@metalsense.test',
        password: 'short',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('10 characters');
  });

  it('POST /api/v1/auth/login - succeeds with correct credentials and returns session', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testEmail,
        password: testPassword,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(testEmail);
    expect(res.body.data.workspaces.length).toBeGreaterThan(0);
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('POST /api/v1/auth/login - fails with wrong password with 401', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testEmail,
        password: 'IncorrectPassword!',
      });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid email or password.');
  });

  it('POST /api/v1/auth/login - enforces lockout after 5 consecutive failed attempts', async () => {
    const bruteEmail = 'bruteforce@metalsense.test';

    // Signup user
    await request(app)
      .post('/api/v1/auth/signup')
      .send({
        name: 'Lockout Target',
        email: bruteEmail,
        password: 'ValidPassword123!',
      });

    // 4 failed attempts -> 401
    for (let i = 0; i < 4; i++) {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: bruteEmail, password: 'WrongPassword' });
      expect(res.status).toBe(401);
    }

    // 5th failed attempt -> 429
    const fifthRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: bruteEmail, password: 'WrongPassword' });
    expect(fifthRes.status).toBe(429);
    expect(fifthRes.body.error).toContain('Account locked');
  });

  it('GET /api/v1/auth/me - returns user profile with valid cookie session', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', [sessionCookie]);

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(testEmail);
    expect(res.body.data.workspaces).toHaveLength(1);
  });

  it('POST /api/v1/auth/change-password - updates password for authenticated user', async () => {
    const newPassword = 'BrandNewPassword2026!';

    const res = await request(app)
      .post('/api/v1/auth/change-password')
      .set('Cookie', [sessionCookie])
      .send({
        currentPassword: testPassword,
        newPassword,
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('Password updated successfully');

    // Login with old password should fail
    const oldLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testEmail, password: testPassword });
    expect(oldLogin.status).toBe(401);

    // Login with new password should succeed
    const newLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testEmail, password: newPassword });
    expect(newLogin.status).toBe(200);
  });

  it('POST /api/v1/auth/forgot-password & /reset-password flow', async () => {
    const forgotRes = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: testEmail });

    expect(forgotRes.status).toBe(200);
    expect(forgotRes.body.resetToken).toBeDefined();

    const resetToken = forgotRes.body.resetToken;
    const finalPassword = 'FinalResetPassword2026!';

    const resetRes = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({
        token: resetToken,
        password: finalPassword,
      });

    expect(resetRes.status).toBe(200);
    expect(resetRes.body.message).toContain('successfully reset');

    // Login with final password works
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testEmail, password: finalPassword });
    expect(loginRes.status).toBe(200);
  });

  it('POST /api/v1/auth/logout - clears session cookie', async () => {
    const res = await request(app).post('/api/v1/auth/logout');
    expect(res.status).toBe(200);
    const cookies = res.headers['set-cookie'];
    expect(cookies[0]).toContain('metalsense_session=;');
  });

  it('POST /api/v1/auth/delete-account - removes user and owned workspace', async () => {
    // Login to get fresh cookie
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testEmail, password: 'FinalResetPassword2026!' });
    const cookie = loginRes.headers['set-cookie'][0].split(';')[0];

    const delRes = await request(app)
      .post('/api/v1/auth/delete-account')
      .set('Cookie', [cookie]);

    expect(delRes.status).toBe(200);
    expect(delRes.body.message).toContain('Account deleted');

    // Subsequent login fails
    const tryLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testEmail, password: 'FinalResetPassword2026!' });
    expect(tryLogin.status).toBe(401);
  });
});
