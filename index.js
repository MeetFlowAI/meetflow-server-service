/**
 * @file     index.js
 * @desc     Server entry point.
 *           Phase 2 update:
 *             - console.log replaced with logger.info (TODO resolved)
 *             - process.on unhandledRejection/uncaughtException moved
 *               into logger.util.js where logger is instantiated
 *
 *           Remaining TODOs resolved in future phases:
 *             Phase 5  → add initializeDatabase() call before listen
 *             Phase 24 → add graceful shutdown (SIGTERM/SIGINT handlers)
 *
 * @author   Adesh
 * @created  2026-05-03
 */

// envConfig must be imported first — validates env vars before anything else.
// logger must be imported second — registers process-level error handlers.
import { envConfig } from "./src/config/env.config.js";
import { logger } from "./src/utils/logger.util.js";
import app from "./src/app.js";

const PORT = envConfig.PORT;

// TODO Phase 5: await initializeDatabase() before app.listen()

app.listen(PORT, "0.0.0.0", () => {
  logger.info(
    { port: PORT, env: envConfig.NODE_ENV },
    "🚀 MeetFlow Server started",
  );
});
