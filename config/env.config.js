/* Imports */
import dotenv from "dotenv";

// ----------------------------------------------------------------------

dotenv.config();

// ----------------------------------------------------------------------

/* Environment Variables */
export const envConfig = {
  BACKEND_SERVICE_PORT: Number(process.env.BACKEND_SERVICE_PORT) || 8000,
  NODE_ENV: process.env.NODE_ENV,

  DATABASE_CREDENTIALS: {
    HOST: process.env.DB_HOST,
    USER: process.env.DB_USER,
    PASSWORD: process.env.DB_PASSWORD,
    DB: process.env.DB_NAME,
    PORT: process.env.DB_PORT,
    DIALECT: process.env.DIALECT,
  },

  HOST_CREDENTIALS: {
    FIRST_NAME: process.env.HOST_FNAME,
    LAST_NAME: process.env.HOST_LNAME,
    EMAIL: process.env.HOST_EMAIL,
    ROLE: process.env.HOST_ROLE,
    PASSWORD: process.env.HOST_PASSWORD,
  },

  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,

  MAIL_FROM_ADDRESS: process.env.MAIL_FROM_ADDRESS,
  MAIL_APP_PASSWORD: process.env.MAIL_APP_PASSWORD,

  FRONTEND_SERVICE_LOCAL_URL: process.env.FRONTEND_SERVICE_LOCAL_URL,
  FRONTEND_SERVICE_PROD_URL: process.env.FRONTEND_SERVICE_PROD_URL,
  BACKEND_SERVICE_LOCAL_URL: process.env.BACKEND_SERVICE_LOCAL_URL,
  BACKEND_SERVICE_PROD_URL: process.env.BACKEND_SERVICE_PROD_URL,

  LIVEKIT_URL: process.env.LIVEKIT_URL,
  LIVEKIT_API_KEY: process.env.LIVEKIT_API_KEY,
  LIVEKIT_API_SECRET: process.env.LIVEKIT_API_SECRET,

  // ── Stream Chat ────────────────────────────────────────────────────────────
  STREAM_API_KEY: process.env.STREAM_API_KEY,
  STREAM_API_SECRET: process.env.STREAM_API_SECRET,

  // ── AI Service ─────────────────────────────────────────────────────────────
  AI_SERVICE_URL: process.env.AI_SERVICE_URL || "http://localhost:8001",
  AI_SERVICE_INTERNAL_KEY: process.env.AI_SERVICE_INTERNAL_KEY || "change-me",
  AI_WEBHOOK_SECRET: process.env.AI_WEBHOOK_SECRET || "change-me",
  BACKEND_WEBHOOK_URL:
    process.env.BACKEND_WEBHOOK_URL ||
    "http://localhost:8000/api/v1/webhook/ai",

  // ── Supabase ───────────────────────────────────────────────────────────────
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,
  SUPABASE_STORAGE_BUCKET: process.env.SUPABASE_STORAGE_BUCKET || "recordings",
  SUPABASE_S3_ACCESS_KEY: process.env.SUPABASE_S3_ACCESS_KEY,
  SUPABASE_S3_SECRET_KEY: process.env.SUPABASE_S3_SECRET_KEY,
  SUPABASE_S3_REGION: process.env.SUPABASE_S3_REGION || "ap-southeast-1",
};
