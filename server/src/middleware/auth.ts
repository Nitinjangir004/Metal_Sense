import { Request, Response, NextFunction } from 'express';
import { verifySessionToken, SESSION_COOKIE_NAME } from '../services/auth/session.js';
import { db } from '../db/store.js';
import { User, UserRole } from '@metalsense/shared';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: User;
      workspaceId?: string;
      userRole?: UserRole;
    }
  }
}

const ROLE_RANK: Record<UserRole, number> = {
  viewer: 1,
  editor: 2,
  owner: 3,
};

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  // Check cookie first, fallback to Authorization header
  let token = req.cookies?.[SESSION_COOKIE_NAME];

  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      error: 'Authentication required. Please sign in.',
    });
  }

  try {
    const payload = verifySessionToken(token);
    const user = await db.findUserById(payload.userId);
    if (!user) {
      return res.status(401).json({ error: 'User session not found or expired.' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session token.' });
  }
}

/**
 * Enforces multi-tenant workspace isolation and RBAC.
 */
export function requireWorkspaceRole(minRole: UserRole = 'viewer') {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const workspaceId =
      req.params.workspaceId ||
      (typeof req.body?.workspaceId === 'string' ? req.body.workspaceId : undefined) ||
      (typeof req.headers['x-workspace-id'] === 'string'
        ? req.headers['x-workspace-id']
        : undefined);

    if (!workspaceId) {
      return res.status(400).json({ error: 'Workspace context (workspaceId) is required.' });
    }

    const workspace = await db.findWorkspaceById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ error: `Workspace '${workspaceId}' not found.` });
    }

    const userRole = await db.getUserRoleInWorkspace(workspaceId, req.user.id);
    if (!userRole) {
      // User is not a member of this workspace -> cross-tenant denial
      return res.status(403).json({
        error: 'Forbidden: You do not have access to this workspace.',
      });
    }

    if (ROLE_RANK[userRole] < ROLE_RANK[minRole]) {
      return res.status(403).json({
        error: `Insufficient permissions. Required role: ${minRole}, current role: ${userRole}.`,
      });
    }

    req.workspaceId = workspaceId;
    req.userRole = userRole;
    next();
  };
}
