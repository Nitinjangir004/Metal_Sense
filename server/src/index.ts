import { app } from './app.js';
import { env } from './config/env.js';

const server = app.listen(env.PORT, () => {
  console.log(`[MetalSense Server] Running on http://localhost:${env.PORT}`);
  console.log(`[MetalSense Server] API Prefix: ${env.API_PREFIX}`);
  console.log(`[MetalSense Server] Calculation Engine: Deterministic v1.0.0`);
});

process.on('SIGTERM', () => {
  console.log('[MetalSense Server] SIGTERM received, shutting down gracefully.');
  server.close(() => {
    process.exit(0);
  });
});
