import { OAuth2Client } from 'google-auth-library';
import { env } from '../../config/env.js';

let googleClient: OAuth2Client | null = null;

function getClient(): OAuth2Client {
  if (!googleClient) {
    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
    googleClient = new OAuth2Client(clientId);
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
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
  const ticket = await client.verifyIdToken({
    idToken,
    audience: clientId,
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
