/**
 * @file     index.js
 * @desc     Server entry point.
 *           Phase 1 update: process.env.PORT replaced with envConfig.PORT.
 *           envConfig validates all env vars at startup — server exits if
 *           any required variable is missing (fail-fast pattern).
 *
 *           Remaining TODOs resolved in future phases:
 *             Phase 2  → replace console.log with logger.info
 *             Phase 2  → add process.on('unhandledRejection') handler
 *             Phase 5  → add initializeDatabase() call before listen
 *             Phase 24 → add graceful shutdown (SIGTERM/SIGINT handlers)
 *
 * @author   Adesh
 * @created  2026-05-03
 */

// envConfig must be imported first — it validates all env vars before
// anything else runs, ensuring the server fails fast with a clear message
// rather than crashing later with a cryptic undefined reference.
import { envConfig } from "./src/config/env.config.js";
import app from "./src/app.js";

const PORT = envConfig.PORT;

app.listen(PORT, "0.0.0.0", () => {
  // TODO Phase 2: replace with logger.info({ port: PORT, env: envConfig.NODE_ENV }, 'Server started')
  console.log(
    `🚀 MeetFlow Server running on port ${PORT} [${envConfig.NODE_ENV}]`,
  );
});
