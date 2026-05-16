/**
 * @file     src/app.js
 * @desc     Express application factory — intentionally minimal at Phase 0.
 *           Only responsibility at this phase: create the Express app and
 *           expose a health check endpoint. Nothing else.
 *
 *           Middleware and infrastructure added phase-by-phase:
 *             Phase 2  → requestId middleware, structured request logging
 *             Phase 3  → helmet, cors, rate limiting, body parsing, rawBody capture
 *             Phase 4  → global errorHandler middleware (must be registered last)
 *             Phase 9  → API routes mounted at /api/v1
 *             Phase 20 → Swagger UI setup
 *
 * @author   Adesh
 * @created  2026-05-03
 */

import express from 'express';

const app = express();

// ── Health check ────────────────────────────────────────────────────────
// Intentionally outside /api/v1 — this is infrastructure-level, not
// application-level. Load balancers and uptime monitors hit this endpoint.
// Phase 23 will enrich this response with DB connectivity status.
app.get('/health', (_req, res) => {
  res.status(200).json({
    status:    'ok',
    service:   'meetflow-server-service',
    version:   '2.0.0',
    timestamp: new Date().toISOString(),
  });
});

// TODO Phase 2:  app.use(requestIdMiddleware)
// TODO Phase 3:  app.use(helmet())
// TODO Phase 3:  app.use(cors(corsOptions))
// TODO Phase 3:  app.use(express.json({ limit: '10mb', verify: rawBodyCapture }))
// TODO Phase 3:  app.use(express.urlencoded({ extended: true, limit: '10mb' }))
// TODO Phase 9:  app.use('/api/v1', apiRoutes)
// TODO Phase 20: setupSwagger(app)
// TODO Phase 4:  app.use(errorHandler)  ← must always be last

export default app;
