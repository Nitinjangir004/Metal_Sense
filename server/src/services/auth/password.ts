import bcrypt from 'bcrypt';
import crypto from 'crypto';

const SALT_ROUNDS = 12;

// In-memory brute force lockout tracker: email -> { attempts, lockoutUntil }
const loginAttempts = new Map<string, { attempts: number; lockoutUntil: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// In-memory password reset token storage: token -> { userId, expiresAt }
const resetTokens = new Map<string, { userId: string; expiresAt: number }>();
const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function checkLoginLockout(email: string): { isLocked: boolean; remainingMinutes?: number } {
  const key = email.toLowerCase().trim();
  const record = loginAttempts.get(key);
  if (!record) return { isLocked: false };

  const now = Date.now();
  if (record.lockoutUntil > now) {
    const remainingMinutes = Math.ceil((record.lockoutUntil - now) / 60000);
    return { isLocked: true, remainingMinutes };
  }

  // Lockout expired
  if (record.lockoutUntil > 0 && record.lockoutUntil <= now) {
    loginAttempts.delete(key);
  }

  return { isLocked: false };
}

export function recordFailedLogin(email: string): { isNowLocked: boolean } {
  const key = email.toLowerCase().trim();
  const record = loginAttempts.get(key) || { attempts: 0, lockoutUntil: 0 };
  record.attempts += 1;

  if (record.attempts >= MAX_ATTEMPTS) {
    record.lockoutUntil = Date.now() + LOCKOUT_DURATION_MS;
    loginAttempts.set(key, record);
    return { isNowLocked: true };
  }

  loginAttempts.set(key, record);
  return { isNowLocked: false };
}

export function clearFailedLogin(email: string): void {
  loginAttempts.delete(email.toLowerCase().trim());
}

export function createPasswordResetToken(userId: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  resetTokens.set(token, {
    userId,
    expiresAt: Date.now() + RESET_TOKEN_EXPIRY_MS,
  });
  return token;
}

export function verifyPasswordResetToken(token: string): string | null {
  const entry = resetTokens.get(token);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    resetTokens.delete(token);
    return null;
  }
  return entry.userId;
}

export function invalidatePasswordResetToken(token: string): void {
  resetTokens.delete(token);
}
