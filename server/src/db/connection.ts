import mongoose from 'mongoose';
import { env } from '../config/env.js';

let isConnected = false;
let connectionError: string | null = null;

export async function connectToDatabase(): Promise<boolean> {
  if (env.NODE_ENV === 'test') {
    // In test environment, memory store is used for ultra-fast, isolated execution
    return true;
  }

  if (isConnected || mongoose.connection.readyState === 1) {
    return true;
  }

  const uri = env.MONGODB_URI;
  if (!uri) {
    connectionError = 'MONGODB_URI is not configured.';
    console.warn('[Database] MONGODB_URI not configured. Operating in fallback memory mode.');
    return false;
  }

  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });
    isConnected = true;
    connectionError = null;
    console.log('[Database] MongoDB connected successfully.');
    return true;
  } catch (err: any) {
    isConnected = false;
    connectionError = err.message || 'Unknown MongoDB connection error';
    console.error(`[Database] Failed to connect to MongoDB: ${connectionError}`);
    if (env.NODE_ENV === 'production') {
      throw new Error(`Production database connection failed: ${connectionError}`);
    }
    return false;
  }
}

export function getDatabaseStatus(): {
  status: 'connected' | 'connecting' | 'disconnected' | 'memory_fallback';
  readyState: number;
  error: string | null;
} {
  if (env.NODE_ENV === 'test') {
    return {
      status: 'memory_fallback',
      readyState: 1,
      error: null,
    };
  }

  const state = mongoose.connection.readyState;
  let status: 'connected' | 'connecting' | 'disconnected' | 'memory_fallback' = 'disconnected';

  if (state === 1) status = 'connected';
  else if (state === 2) status = 'connecting';
  else if (!env.MONGODB_URI) status = 'memory_fallback';

  return {
    status,
    readyState: state,
    error: connectionError,
  };
}
