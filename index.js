/**
 * @file     index.js
 * @desc     Server entry point — intentionally minimal at Phase 0.
 *           Infrastructure layers are introduced phase-by-phase:
 *             Phase 1  → replace process.env.PORT with envConfig
 *             Phase 2  → replace console.log with logger.info
 *             Phase 2  → add process.on('unhandledRejection') handler
 *             Phase 5  → add initializeDatabase() call before listen
 *             Phase 24 → add graceful shutdown (SIGTERM/SIGINT handlers)
 *
 * @author   Adesh
 * @created  2026-05-03
 */

import app from './src/app.js';

// TODO Phase 1: replace with envConfig.BACKEND_SERVICE_PORT
const PORT = process.env.PORT || 8000;

app.listen(PORT, '0.0.0.0', () => {
  // TODO Phase 2: replace with logger.info({ port: PORT }, 'Server started')
  console.log(`🚀 MeetFlow Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});
