import { OAuth2Client } from 'google-auth-library';
import { env } from '../../config/env.js';

let googleClient: OAuth2Client | null = null;

function getClient(): OAuth2Client {
  if (!googleClient) {
    googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }
  return googleClient;
}

export interface VerifiedGoogleUser {
  googleSub: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

/**
 * Validates Google ID token server-side using Google Auth Library.
 * Never trust client-supplied profile fields.
 */
export async function verifyGoogleIdToken(idToken: string): Promise<VerifiedGoogleUser> {
  const client = getClient();
  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload) {
    throw new Error('Invalid Google ID token: empty payload.');
  }

  if (!payload.email || !payload.email_verified) {
    throw new Error('Google identity verification failed: unverified email.');
  }

  return {
    googleSub: payload.sub,
    email: payload.email,
    name: payload.name || payload.email.split('@')[0],
    avatarUrl: payload.picture,
  };
}
