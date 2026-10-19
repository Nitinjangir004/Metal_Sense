import express from 'express';
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

// Versioned API Routes
const api = express.Router();
api.use('/health', healthRouter);
api.use('/standards', standardsRouter);
api.use('/demo', demoRouter);
api.use('/auth', authRouter);
api.use('/workspaces', workspacesRouter);
api.use('/imports', importsRouter);

app.use(env.API_PREFIX, api);

// Centralized Error Handling
app.use(errorHandler);
