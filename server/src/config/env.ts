import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default('5000'),
  API_PREFIX: z.string().default('/api/v1'),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
  MONGODB_URI: z.string().optional().default('mongodb://localhost:27017/metalsense'),
  SESSION_SECRET: z.string().default('metalsense_dev_session_secret_32chars_required'),
  UPLOAD_MAX_BYTES: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default('10485760'),
});

export const env = EnvSchema.parse(process.env);
