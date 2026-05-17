/**
 * @file     src/utils/logger.util.js
 * @desc     Production-grade structured logger built on Pino.
 *
 *           Configuration strategy:
 *             development → pino-pretty (human-readable, colorized, timestamp)
 *             production  → JSON (machine-readable, parsed by log aggregators)
 *             test        → silent (no log output during test runs)
 *
 *           Auto-redaction: sensitive fields listed in REDACTED_PATHS are
 *           replaced with '[REDACTED]' at the serialization layer — they never
 *           reach the log output regardless of log level. This is enforced by
 *           Pino's redact option, not by application code.
 *
 *           Request-scoped child loggers:
 *             Use logger.child({ requestId }) inside middleware to bind a
 *             correlation ID to all log lines within a single request lifecycle.
 *             See: src/middlewares/requestId.middleware.js
 *
 *           Exported:
 *             logger — the root Pino logger instance (frozen — no reassignment)
 *
 *           RULES:
 *             - This file is the ONLY place that imports 'pino'.
 *             - All other files import { logger } from here.
 *             - No console.* anywhere in the codebase after Phase 2 except
 *               env.config.js (fail-fast, runs before logger exists) and
 *               index.js startup (replaced in this phase).
 *
 * @author   Adesh
 * @created  2026-05-03
 */

// ----------------------------------------------------------------------
/* Imports */
import pino from "pino";
import { envConfig } from "../config/env.config.js";

// ----------------------------------------------------------------------
/* Sensitive field paths auto-redacted from all log output */

const REDACTED_PATHS = [
  // Auth
  "password",
  "new_password",
  "current_password",
  "confirm_password",
  "password_reset_token",

  // Tokens
  "token",
  "access_token",
  "refresh_token",
  "accessToken",
  "refreshToken",
  "authorization",
  "req.headers.authorization",
  'res.headers["set-cookie"]',

  // Secrets
  "secret",
  "api_key",
  "apiKey",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
  "MAIL_PASSWORD",
  "AI_INTERNAL_KEY",
  "AI_WEBHOOK_SECRET",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_S3_SECRET_KEY",
  "LIVEKIT_API_SECRET",
  "STREAM_API_SECRET",

  // PII
  "credit_card",
  "ssn",
  "otp",
];

// ----------------------------------------------------------------------
/* Logger configuration by environment */

const buildLoggerOptions = () => {
  const level =
    process.env.LOG_LEVEL || (envConfig.IS_TEST ? "silent" : "info");

  const base = {
    level,
    timestamp: pino.stdTimeFunctions.isoTime,

    // Base fields added to every log line
    base: {
      service: "meetflow-server-service",
      env: envConfig.NODE_ENV,
    },

    // Auto-redact sensitive fields — never reaches log output
    redact: {
      paths: REDACTED_PATHS,
      censor: "[REDACTED]",
    },

    // Serializers normalize Error objects and HTTP request/response
    serializers: {
      err: pino.stdSerializers.err,
      req: pino.stdSerializers.req,
      res: pino.stdSerializers.res,
    },
  };

  if (envConfig.IS_DEVELOPMENT) {
    return {
      ...base,
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:HH:MM:ss.l",
          ignore: "pid,hostname,service,env",
          messageFormat: "{msg}",
          errorLikeObjectKeys: ["err", "error"],
          singleLine: false,
        },
      },
    };
  }

  // Production / staging — structured JSON, parsed by log aggregators
  return base;
};

// ----------------------------------------------------------------------
/* Instantiate and freeze the root logger */

/**
 * Root Pino logger instance.
 * Import this everywhere logging is needed.
 * For request-scoped logging, create a child:
 *   const reqLogger = logger.child({ requestId: req.requestId });
 *
 * @type {import('pino').Logger}
 */
export const logger = pino(buildLoggerOptions());

// ----------------------------------------------------------------------
/* Process-level error event handlers */
// Registered here so the logger is available when they fire.
// These are the only safety net for truly unexpected failures.

process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "Uncaught exception — process will exit");
  // Flush pino's buffer before exiting so the log line is not lost
  process.nextTick(() => process.exit(1));
});

process.on("unhandledRejection", (reason) => {
  // Unhandled rejections are logged as errors but do NOT exit the process.
  // A separate monitoring alert (Phase 23) should fire on repeated occurrences.
  logger.error(
    { reason: reason instanceof Error ? reason.message : String(reason) },
    "Unhandled promise rejection — check async error handling",
  );
});
