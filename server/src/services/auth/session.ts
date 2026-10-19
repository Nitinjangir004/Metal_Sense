import jwt from 'jsonwebtoken';
import { Response, CookieOptions } from 'express';
import { env } from '../../config/env.js';
import { User } from '@metalsense/shared';

const SESSION_COOKIE_NAME = 'metalsense_session';
const SESSION_EXPIRY = '7d';

export interface SessionPayload {
  userId: string;
  email: string;
}

export function createSessionToken(user: User): string {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
    },
    env.SESSION_SECRET,
    { expiresIn: SESSION_EXPIRY }
  );
}

export function verifySessionToken(token: string): SessionPayload {
  return jwt.verify(token, env.SESSION_SECRET) as SessionPayload;
}

export function setSessionCookie(res: Response, token: string) {
  const options: CookieOptions = {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  };
  res.cookie(SESSION_COOKIE_NAME, token, options);
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}

export { SESSION_COOKIE_NAME };
