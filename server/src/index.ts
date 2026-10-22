import { app } from './app.js';
import { env } from './config/env.js';
import { connectToDatabase } from './db/connection.js';

async function bootstrap() {
  process.on('unhandledRejection', (reason) => {
    console.error('[MetalSense Server] Unhandled Promise Rejection:', reason);
  });

  process.on('uncaughtException', (err) => {
    console.error('[MetalSense Server] Uncaught Exception:', err);
  });

  await connectToDatabase();

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
}

bootstrap().catch((err) => {
  console.error('[MetalSense Server] Bootstrap failed:', err);
  process.exit(1);
});
