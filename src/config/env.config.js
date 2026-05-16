/**
 * @file     src/config/env.config.js
 * @desc     Environment variable validation and typed configuration object.
 *           Uses Zod to validate all required env vars at server startup.
 *           If any required variable is missing or invalid, the process exits
 *           immediately with a clear, actionable error message (fail-fast).
 *
 *           RULES:
 *             - All process.env access in the application goes through envConfig.
 *               No other file may call process.env directly (except this one).
 *             - This file may use console.error for the fail-fast message ONLY.
 *               It runs before the logger exists (logger is Phase 2).
 *             - No imports from our own codebase — only 'zod' and 'dotenv'.
 *
 *           Exported:
 *             envConfig   — typed, validated configuration object
 *             IS_PRODUCTION, IS_DEVELOPMENT, IS_TEST — convenience booleans
 *
 * @author   Adesh
 * @created  2026-05-03
 */

// ----------------------------------------------------------------------
/* Imports */
import { z }   from 'zod';
import dotenv  from 'dotenv';

// ----------------------------------------------------------------------
/* Load .env file into process.env before validation */

// In production, env vars are injected by the platform (Railway/Docker/K8s).
// In development/test, dotenv loads from .env.development or .env.test.
const ENV_FILE = process.env.NODE_ENV === 'test' ? '.env.test' : '.env.development';
dotenv.config({ path: ENV_FILE });

// Fallback: also attempt plain .env (covers cases where NODE_ENV is not set)
dotenv.config({ path: '.env', override: false });

// ----------------------------------------------------------------------
/* Zod schema — every required variable defined and documented */

const envSchema = z.object({

  // ── Server ─────────────────────────────────────────────────────────
  NODE_ENV: z.enum(['development', 'staging', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().int().min(1024).max(65535).default(8000),

  // ── Database ────────────────────────────────────────────────────────
  // DATABASE_URL takes priority over individual vars.
  // One of the two must be present.
  DATABASE_URL: z.string().url().optional(),
  DB_HOST:      z.string().optional().default('localhost'),
  DB_PORT:      z.coerce.number().int().default(5432),
  DB_NAME:      z.string().optional().default('meetflow_db'),
  DB_USER:      z.string().optional().default('postgres'),
  DB_PASSWORD:  z.string().optional().default(''),
  DB_SSL:       z.enum(['true', 'false']).default('false'),

  // ── Authentication ──────────────────────────────────────────────────
  JWT_ACCESS_SECRET:  z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),

  // ── System owner (seeded on first run) ─────────────────────────────
  HOST_FIRST_NAME: z.string().min(1).default('Admin'),
  HOST_LAST_NAME:  z.string().min(1).default('User'),
  HOST_EMAIL:      z.string().email(),
  HOST_PASSWORD:   z.string().min(8),
  HOST_ROLE:       z.string().default('master_super_admin'),

  // ── Email ───────────────────────────────────────────────────────────
  MAIL_FROM:     z.string().optional(),
  MAIL_PASSWORD: z.string().optional(),

  // ── Service URLs ────────────────────────────────────────────────────
  WEBHOOK_URL:        z.string().url().optional(),
  FRONTEND_URL_PROD:  z.string().url().optional(),
  FRONTEND_URL_LOCAL: z.string().url().optional().default('http://localhost:5173'),
  BACKEND_SERVICE_URL:z.string().url().optional().default('http://localhost:8000'),

  // ── LiveKit ─────────────────────────────────────────────────────────
  LIVEKIT_URL:        z.string().optional(),
  LIVEKIT_API_KEY:    z.string().optional(),
  LIVEKIT_API_SECRET: z.string().optional(),

  // ── Stream Chat ─────────────────────────────────────────────────────
  STREAM_API_KEY:    z.string().optional(),
  STREAM_API_SECRET: z.string().optional(),

  // ── AI Service ──────────────────────────────────────────────────────
  AI_SERVICE_URL:     z.string().url().optional().default('http://localhost:8001'),
  AI_INTERNAL_KEY:    z.string().optional().default('change-me-in-production'),
  AI_WEBHOOK_SECRET:  z.string().optional().default('change-me-in-production'),

  // ── Supabase / Storage ──────────────────────────────────────────────
  SUPABASE_URL:            z.string().url().optional(),
  SUPABASE_ANON_KEY:       z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_S3_ACCESS_KEY:  z.string().optional(),
  SUPABASE_S3_SECRET_KEY:  z.string().optional(),
  SUPABASE_S3_REGION:      z.string().default('ap-south-1'),
  SUPABASE_STORAGE_BUCKET: z.string().default('meetflow-recordings'),

}).superRefine((data, ctx) => {
  // DATABASE_URL OR individual vars must be present
  const hasConnectionString = !!data.DATABASE_URL;
  const hasIndividualVars   = !!data.DB_USER && !!data.DB_NAME;
  if (!hasConnectionString && !hasIndividualVars) {
    ctx.addIssue({
      code:    z.ZodIssueCode.custom,
      message: 'Either DATABASE_URL or DB_HOST/DB_USER/DB_NAME/DB_PASSWORD must be set',
      path:    ['DATABASE_URL'],
    });
  }
});

// ----------------------------------------------------------------------
/* Parse and validate — fail-fast on invalid config */

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // console.error is the ONLY acceptable console.* call in the entire codebase.
  // This fires before logger exists (logger is Phase 2).
  console.error('\n❌ Environment validation failed — server cannot start.\n');
  console.error('Missing or invalid environment variables:\n');

  const errors = parsed.error.flatten();

  Object.entries(errors.fieldErrors).forEach(([field, messages]) => {
    messages.forEach((msg) => {
      console.error(`  ✗ ${field}: ${msg}`);
    });
  });

  errors.formErrors.forEach((msg) => {
    console.error(`  ✗ ${msg}`);
  });

  console.error('\nCopy .env.example to .env.development and fill in all required values.\n');
  process.exit(1);
}

const env = parsed.data;

// ----------------------------------------------------------------------
/* Build typed envConfig object — grouped by concern */

export const envConfig = Object.freeze({

  NODE_ENV: env.NODE_ENV,
  PORT:     env.PORT,

  // Convenience flags used throughout the codebase
  IS_PRODUCTION:  env.NODE_ENV === 'production',
  IS_DEVELOPMENT: env.NODE_ENV === 'development',
  IS_TEST:        env.NODE_ENV === 'test',

  DB: Object.freeze({
    CONNECTION_STRING: env.DATABASE_URL || null,
    HOST:     env.DB_HOST,
    PORT:     env.DB_PORT,
    NAME:     env.DB_NAME,
    USER:     env.DB_USER,
    PASSWORD: env.DB_PASSWORD,
    SSL:      env.DB_SSL === 'true' || !!env.DATABASE_URL,
  }),

  JWT: Object.freeze({
    ACCESS_SECRET:  env.JWT_ACCESS_SECRET,
    REFRESH_SECRET: env.JWT_REFRESH_SECRET,
  }),

  HOST_CREDENTIALS: Object.freeze({
    FIRST_NAME: env.HOST_FIRST_NAME,
    LAST_NAME:  env.HOST_LAST_NAME,
    EMAIL:      env.HOST_EMAIL,
    PASSWORD:   env.HOST_PASSWORD,
    ROLE:       env.HOST_ROLE,
  }),

  MAIL: Object.freeze({
    FROM:     env.MAIL_FROM     || null,
    PASSWORD: env.MAIL_PASSWORD || null,
  }),

  URLS: Object.freeze({
    WEBHOOK:        env.WEBHOOK_URL        || null,
    FRONTEND_PROD:  env.FRONTEND_URL_PROD  || null,
    FRONTEND_LOCAL: env.FRONTEND_URL_LOCAL,
    BACKEND:        env.BACKEND_SERVICE_URL,
  }),

  LIVEKIT: Object.freeze({
    URL:    env.LIVEKIT_URL        || null,
    KEY:    env.LIVEKIT_API_KEY    || null,
    SECRET: env.LIVEKIT_API_SECRET || null,
  }),

  STREAM: Object.freeze({
    KEY:    env.STREAM_API_KEY    || null,
    SECRET: env.STREAM_API_SECRET || null,
  }),

  AI: Object.freeze({
    SERVICE_URL:   env.AI_SERVICE_URL,
    INTERNAL_KEY:  env.AI_INTERNAL_KEY,
    WEBHOOK_SECRET:env.AI_WEBHOOK_SECRET,
  }),

  SUPABASE: Object.freeze({
    URL:              env.SUPABASE_URL              || null,
    ANON_KEY:         env.SUPABASE_ANON_KEY         || null,
    SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_ROLE_KEY || null,
    S3_ACCESS_KEY:    env.SUPABASE_S3_ACCESS_KEY    || null,
    S3_SECRET_KEY:    env.SUPABASE_S3_SECRET_KEY    || null,
    S3_REGION:        env.SUPABASE_S3_REGION,
    BUCKET:           env.SUPABASE_STORAGE_BUCKET,
  }),

});

// Convenience re-exports so callers can write:
// import { envConfig, IS_PRODUCTION } from './config/env.config.js'
export const IS_PRODUCTION  = envConfig.IS_PRODUCTION;
export const IS_DEVELOPMENT = envConfig.IS_DEVELOPMENT;
export const IS_TEST        = envConfig.IS_TEST;
