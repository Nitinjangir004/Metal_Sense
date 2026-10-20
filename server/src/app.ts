import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { requestId } from './middleware/requestId.js';
import { errorHandler } from './middleware/errorHandler.js';
import { healthRouter } from './routes/health.js';
import { standardsRouter } from './routes/standards.js';
import { demoRouter } from './routes/demo.js';
import { authRouter } from './routes/auth.js';
import { workspacesRouter } from './routes/workspaces.js';
import { importsRouter } from './routes/imports.js';

export const app = express();

// Security Headers
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: env.CLIENT_ORIGIN,
    credentials: true,
  })
);

// Body and Cookie parsing
app.use(express.json({ limit: '5mb' }));
app.use(cookieParser());

// Request ID tracking
app.use(requestId);

// Rate Limiting (Dev friendly, production safe)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { error: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Stricter rate limiting on authentication routes (10 requests per 15 minutes)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many authentication attempts, please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
});
app.use(`${env.API_PREFIX}/auth`, authLimiter);

// Versioned API Routes
const api = express.Router();
api.use('/health', healthRouter);
api.use('/standards', standardsRouter);
api.use('/demo', demoRouter);
api.use('/auth', authRouter);
api.use('/workspaces', workspacesRouter);
api.use('/imports', importsRouter);

app.use(env.API_PREFIX, api);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Production Static Client Bundle Serving
if (env.NODE_ENV === 'production') {
  const possibleClientPaths = [
    path.resolve(__dirname, '../../client/dist'),
    path.resolve(process.cwd(), 'client/dist'),
    path.resolve(process.cwd(), '../client/dist'),
  ];
  const clientDist = possibleClientPaths.find((p) => fs.existsSync(p));
  if (clientDist) {
    app.use(express.static(clientDist));
    app.get('*', (req: Request, res: Response, next: NextFunction) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }
}

// Centralized Error Handling
app.use(errorHandler);
