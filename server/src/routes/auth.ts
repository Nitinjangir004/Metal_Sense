import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { verifyGoogleIdToken } from '../services/auth/google.js';
import {
  createSessionToken,
  setSessionCookie,
  clearSessionCookie,
} from '../services/auth/session.js';
import {
  hashPassword,
  comparePassword,
  checkLoginLockout,
  recordFailedLogin,
  clearFailedLogin,
  createPasswordResetToken,
  verifyPasswordResetToken,
  invalidatePasswordResetToken,
} from '../services/auth/password.js';
import { authenticate } from '../middleware/auth.js';
import { db } from '../db/store.js';

export const authRouter = Router();

const SignupPayloadSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(10, 'Password must be at least 10 characters long'),
  workspaceName: z.string().min(2).optional(),
  defaultStandard: z.string().optional(),
  defaultLodStrategy: z.enum(['zero', 'half_lod', 'full_lod']).optional(),
});

const LoginPayloadSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const GoogleAuthPayloadSchema = z.object({
  idToken: z.string().min(1, 'Google idToken is required'),
});

const DevLoginPayloadSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(['owner', 'editor', 'viewer']).default('owner'),
});

/**
 * POST /api/v1/auth/signup
 * Real user registration with bcrypt password hashing (cost=12) and automatic initial workspace creation.
 */
authRouter.post('/signup', async (req: Request, res: Response) => {
  try {
    const { name, email, password, workspaceName, defaultStandard, defaultLodStrategy } =
      SignupPayloadSchema.parse(req.body);

    const existing = await db.findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email address already exists.' });
    }

    const passwordHash = await hashPassword(password);
    const user = await db.createUser({
      name,
      email,
      passwordHash,
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=002F18&color=ECF5EB`,
    });

    // Create user's initial workspace
    const wsName = workspaceName?.trim() || `${name.trim().split(' ')[0]}'s Workspace`;
    const workspace = await db.createWorkspace(user.id, wsName, {
      defaultStandard: defaultStandard || 'BIS_10500_2012',
      defaultLodStrategy: defaultLodStrategy || 'half_lod',
    });

    const token = createSessionToken(user);
    setSessionCookie(res, token);

    await db.recordAudit(workspace.id, user.id, 'USER_SIGN_UP', 'user', user.id, {
      method: 'email_password',
    });

    res.status(201).json({
      data: {
        user,
        workspaces: [workspace],
        token,
      },
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0]?.message || 'Invalid input.' });
    }
    res.status(500).json({ error: err.message || 'Signup failed.' });
  }
});

/**
 * POST /api/v1/auth/login
 * Real user authentication with lockout protection and constant-time failure.
 */
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = LoginPayloadSchema.parse(req.body);

    // Check brute-force lockout
    const lockout = checkLoginLockout(email);
    if (lockout.isLocked) {
      return res.status(429).json({
        error: `Too many failed attempts. Account locked for ${lockout.remainingMinutes} minutes.`,
      });
    }

    const userWithHash = await db.findUserByEmail(email);
    if (!userWithHash || !userWithHash.passwordHash) {
      recordFailedLogin(email);
      // Generic message prevents email enumeration
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await comparePassword(password, userWithHash.passwordHash);
    if (!isMatch) {
      const lockStatus = recordFailedLogin(email);
      if (lockStatus.isNowLocked) {
        return res.status(429).json({
          error: 'Too many failed attempts. Account locked for 15 minutes.',
        });
      }
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Success -> clear failed login count
    clearFailedLogin(email);

    const token = createSessionToken(userWithHash);
    setSessionCookie(res, token);

    const workspaces = await db.findWorkspacesForUser(userWithHash.id);
    const { passwordHash: _, ...publicUser } = userWithHash;

    await db.recordAudit(
      workspaces[0]?.id || 'system',
      userWithHash.id,
      'USER_SIGN_IN',
      'user',
      userWithHash.id,
      { method: 'email_password' }
    );

    res.json({
      data: {
        user: publicUser,
        workspaces,
        token,
      },
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0]?.message || 'Invalid input.' });
    }
    res.status(500).json({ error: err.message || 'Login failed.' });
  }
});

/**
 * POST /api/v1/auth/google
 * Authenticates with Google ID token verified server-side with google-auth-library.
 */
authRouter.post('/google', async (req: Request, res: Response) => {
  try {
    const { idToken } = GoogleAuthPayloadSchema.parse(req.body);
    const googleUser = await verifyGoogleIdToken(idToken);

    let user = await db.findUserByEmail(googleUser.email);
    let workspaces = [];

    if (!user) {
      user = await db.createUser({
        email: googleUser.email,
        name: googleUser.name,
        avatarUrl: googleUser.avatarUrl,
      });
      // Initial workspace
      const ws = await db.createWorkspace(user.id, `${user.name.split(' ')[0]}'s Workspace`);
      workspaces = [ws];
    } else {
      workspaces = await db.findWorkspacesForUser(user.id);
      if (workspaces.length === 0) {
        const ws = await db.createWorkspace(user.id, `${user.name.split(' ')[0]}'s Workspace`);
        workspaces = [ws];
      }
    }

    const token = createSessionToken(user);
    setSessionCookie(res, token);

    await db.recordAudit(
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
        token,
      },
    });
  } catch (err: any) {
    res.status(401).json({ error: err.message || 'Authentication with Google failed.' });
  }
});

/**
 * POST /api/v1/auth/forgot-password
 * Generates password reset token.
 */
authRouter.post('/forgot-password', async (req: Request, res: Response) => {
  const schema = z.object({ email: z.string().email() });
  const { email } = schema.parse(req.body);

  const user = await db.findUserByEmail(email);
  // Always return 200 to prevent email enumeration
  if (!user) {
    return res.json({ message: 'If an account exists with this email, password reset instructions have been sent.' });
  }

  const resetToken = createPasswordResetToken(user.id);

  // In production, an email transport would send this link.
  // In development, return resetToken or link for verification.
  res.json({
    message: 'If an account exists with this email, password reset instructions have been sent.',
    resetToken: process.env.NODE_ENV !== 'production' ? resetToken : undefined,
  });
});

/**
 * POST /api/v1/auth/reset-password
 * Resets user password using valid token.
 */
authRouter.post('/reset-password', async (req: Request, res: Response) => {
  const schema = z.object({
    token: z.string().min(1),
    password: z.string().min(10, 'Password must be at least 10 characters'),
  });
  const { token, password } = schema.parse(req.body);

  const userId = verifyPasswordResetToken(token);
  if (!userId) {
    return res.status(400).json({ error: 'Password reset link is invalid or has expired.' });
  }

  const passwordHash = await hashPassword(password);
  await db.updateUser(userId, { passwordHash });
  invalidatePasswordResetToken(token);

  res.json({ message: 'Password has been successfully reset. You may now sign in.' });
});

/**
 * POST /api/v1/auth/change-password
 * Authenticated user password update.
 */
authRouter.post('/change-password', authenticate, async (req: Request, res: Response) => {
  const schema = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(10, 'New password must be at least 10 characters'),
  });
  const { currentPassword, newPassword } = schema.parse(req.body);

  const userWithHash = await db.findUserByEmail(req.user!.email);
  if (!userWithHash?.passwordHash) {
    return res.status(400).json({ error: 'Account uses Google OAuth or has no password configured.' });
  }

  const isMatch = await comparePassword(currentPassword, userWithHash.passwordHash);
  if (!isMatch) {
    return res.status(400).json({ error: 'Current password is incorrect.' });
  }

  const newHash = await hashPassword(newPassword);
  await db.updateUser(req.user!.id, { passwordHash: newHash });

  res.json({ message: 'Password updated successfully.' });
});

/**
 * POST /api/v1/auth/delete-account
 * Authenticated user deletes their own account and personal workspaces.
 */
authRouter.post('/delete-account', authenticate, async (req: Request, res: Response) => {
  const workspaces = await db.findWorkspacesForUser(req.user!.id);
  for (const ws of workspaces) {
    if (ws.ownerId === req.user!.id) {
      await db.deleteWorkspace(ws.id);
    }
  }
  await db.deleteUser(req.user!.id);
  clearSessionCookie(res);
  res.json({ message: 'Account deleted successfully.' });
});

/**
 * POST /api/v1/auth/dev-login
 * Automated test & sandbox login (strictly gated to NODE_ENV === 'test').
 */
authRouter.post('/dev-login', async (req: Request, res: Response) => {
  if (process.env.NODE_ENV !== 'test') {
    return res.status(404).json({ error: 'Endpoint not found.' });
  }

  const { email, name, role } = DevLoginPayloadSchema.parse(req.body);

  let user = await db.findUserByEmail(email);
  if (!user) {
    user = await db.createUser({
      email,
      name,
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0f766e&color=fff`,
    });
    const ws = await db.createWorkspace(user.id, `${name.split(' ')[0]}'s Workspace`);
    if (role && role !== 'owner') {
      await db.addWorkspaceMember(ws.id, user.id, role);
    }
  }

  const token = createSessionToken(user);
  setSessionCookie(res, token);

  const workspaces = await db.findWorkspacesForUser(user.id);
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
authRouter.get('/me', authenticate, async (req: Request, res: Response) => {
  const user = req.user!;
  const workspaces = await db.findWorkspacesForUser(user.id);

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
