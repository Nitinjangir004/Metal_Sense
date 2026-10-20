import { IStore } from './types.js';
import { MemoryStore } from './memoryStore.js';
import { MongoStore } from './mongoStore.js';
import { env } from '../config/env.js';

export * from './types.js';
export * from './models/index.js';
export * from './memoryStore.js';
export * from './mongoStore.js';

// If running in test mode, always use MemoryStore for test isolation.
// In dev and prod, use MongoStore when MONGODB_URI is provided.
export const db: IStore =
  env.NODE_ENV === 'test' ? new MemoryStore() : new MongoStore();
