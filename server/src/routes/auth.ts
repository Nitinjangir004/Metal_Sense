import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { verifyGoogleIdToken } from '../services/auth/google.js';
import {
  createSessionToken,
  setSessionCookie,
  clearSessionCookie,
} from '../services/auth/session.js';
import { authenticate } from '../middleware/auth.js';
import { db } from '../db/store.js';

export const authRouter = Router();

const GoogleAuthPayloadSchema = z.object({
  idToken: z.string().min(1, 'Google idToken is required'),
});

const DevLoginPayloadSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(['owner', 'editor', 'viewer']).default('owner'),
});

/**
 * POST /api/v1/auth/google
 * Authenticates with Google ID token, verifies on backend, creates session.
 */
authRouter.post('/google', async (req: Request, res: Response) => {
  try {
    const { idToken } = GoogleAuthPayloadSchema.parse(req.body);
    const googleUser = await verifyGoogleIdToken(idToken);

    let user = db.findUserByEmail(googleUser.email);
    if (!user) {
      user = db.createUser({
        email: googleUser.email,
        name: googleUser.name,
        avatarUrl: googleUser.avatarUrl,
      });
    }

    const token = createSessionToken(user);
    setSessionCookie(res, token);

    const workspaces = db.findWorkspacesForUser(user.id);
    db.recordAudit(
      workspaces[0]?.id || 'system',
      user.id,
      'USER_SIGN_IN',
      'user',
      user.id,
      { method: 'google_oauth' }
    );

    res.json({
      data: {
        user,
        workspaces,
        token, // Provided for API clients / mobile headers
      },
    });
  } catch (err: any) {
    res.status(401).json({ error: err.message || 'Authentication with Google failed.' });
  }
});

/**
 * POST /api/v1/auth/dev-login
 * Automated test & sandbox login (strictly gated to NODE_ENV === 'test').
 */
authRouter.post('/dev-login', (req: Request, res: Response) => {
  if (process.env.NODE_ENV !== 'test') {
    return res.status(404).json({ error: 'Endpoint not found.' });
  }

  const { email, name, role } = DevLoginPayloadSchema.parse(req.body);

  let user = db.findUserByEmail(email);
  if (!user) {
    user = db.createUser({
      email,
      name,
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0f766e&color=fff`,
    });
  }

  const token = createSessionToken(user);
  setSessionCookie(res, token);

  const workspaces = db.findWorkspacesForUser(user.id);
  res.json({
    data: {
      user,
      workspaces,
      token,
      isDevLogin: true,
    },
  });
});

/**
 * GET /api/v1/auth/me
 * Retrieves current authenticated user profile and workspaces.
 */
authRouter.get('/me', authenticate, (req: Request, res: Response) => {
  const user = req.user!;
  const workspaces = db.findWorkspacesForUser(user.id);

  res.json({
    data: {
      user,
      workspaces,
    },
  });
});

/**
 * POST /api/v1/auth/logout
 * Destroys user session cookie.
 */
authRouter.post('/logout', (req: Request, res: Response) => {
  clearSessionCookie(res);
  res.json({ message: 'Signed out successfully.' });
});
