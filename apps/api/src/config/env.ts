import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_PORT: z.string().transform(Number).pipe(z.number().int().positive()).default('4000'),
  APP_URL: z.string().url(),
  API_URL: z.string().url(),
  DATABASE_URL: z.string().min(1),
  SESSION_SECRET: z.string().min(32).refine(
    (val) => process.env.NODE_ENV !== 'production' || val !== 'dev-secret-change-in-production-minimum-32-chars',
    'Must use a secure SESSION_SECRET in production'
  ),
  AWS_REGION: z.string().default('ap-southeast-1'),
  S3_BUCKET_NAME: z.string().min(1),
  REKOGNITION_COLLECTION_ID: z.string().min(1),
  PHOTO_RETENTION_DAYS: z.string().transform(Number).pipe(z.number().int().positive()).default('7'),
  SIGNED_URL_TTL_SECONDS: z.string().transform(Number).pipe(z.number().int().positive()).default('300'),
  KIOSK_SESSION_TTL_MINUTES: z.string().transform(Number).pipe(z.number().int().positive()).default('30'),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
});

function validateEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Invalid environment variables:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      }
    }
    throw error;
  }
}

export const env = validateEnv();

export type Env = z.infer<typeof envSchema>;
