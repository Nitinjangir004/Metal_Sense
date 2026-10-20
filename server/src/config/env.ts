import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const EnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z
      .string()
      .transform((val) => parseInt(val, 10))
      .default('5000'),
    API_PREFIX: z.string().default('/api/v1'),
    CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
    MONGODB_URI: z.string().optional().default('mongodb://localhost:27017/metalsense'),
    SESSION_SECRET: z.string().default('metalsense_dev_session_secret_32chars_required'),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    GEMINI_API_KEY: z.string().optional(),
    GEMINI_MODEL: z.string().default('gemini-2.5-flash'),
    AI_TIMEOUT_MS: z
      .string()
      .transform((val) => parseInt(val, 10))
      .default('20000'),
    UPLOAD_MAX_BYTES: z
      .string()
      .transform((val) => parseInt(val, 10))
      .default('10485760'),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === 'production') {
      if (!data.SESSION_SECRET || data.SESSION_SECRET.length < 32) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'SESSION_SECRET must be at least 32 characters long in production.',
          path: ['SESSION_SECRET'],
        });
      }
      if (
        data.SESSION_SECRET === 'metalsense_dev_session_secret_32chars_required' ||
        data.SESSION_SECRET.includes('dev_session_secret')
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Cannot use default development SESSION_SECRET in production mode.',
          path: ['SESSION_SECRET'],
        });
      }
      if (!data.MONGODB_URI || data.MONGODB_URI.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'MONGODB_URI is required in production mode.',
          path: ['MONGODB_URI'],
        });
      }
    }
  });

export const env = EnvSchema.parse(process.env);
