/**
 * @file     src/app.js
 * @desc     Express application factory.
 *           Phase 2 update: requestId middleware wired as the first middleware.
 *           All subsequent requests now carry a correlation ID in req.requestId
 *           and a request-scoped logger at req.log.
 *
 *           Middleware registered so far:
 *             Phase 2  → requestIdMiddleware (first — must be before everything)
 *
 *           Middleware added in future phases:
 *             Phase 3  → helmet, cors, rate limiting, body parsing, rawBody capture
 *             Phase 4  → global errorHandler (must be registered last)
 *             Phase 9  → API routes mounted at /api/v1
 *             Phase 20 → Swagger UI setup
 *
 * @author   Adesh
 * @created  2026-05-03
 */

import express from "express";
import { requestIdMiddleware } from "./middlewares/requestId.middleware.js";

const app = express();

// ── Observability — must be first ──────────────────────────────────────
// requestIdMiddleware assigns a UUID to every request and creates a
// request-scoped child logger at req.log. Must be registered before any
// other middleware so all downstream handlers have access to req.log.
app.use(requestIdMiddleware);

// ── Health check ────────────────────────────────────────────────────────
// Phase 23 will enrich this with DB connectivity status.
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "meetflow-server-service",
    version: "2.0.0",
    timestamp: new Date().toISOString(),
  });
});

// TODO Phase 3:  app.use(helmet())
// TODO Phase 3:  app.use(cors(corsOptions))
// TODO Phase 3:  app.use(express.json({ limit: '10mb', verify: rawBodyCapture }))
// TODO Phase 3:  app.use(express.urlencoded({ extended: true, limit: '10mb' }))
// TODO Phase 9:  app.use('/api/v1', apiRoutes)
// TODO Phase 20: setupSwagger(app)
// TODO Phase 4:  app.use(errorHandler)  ← must always be last

export default app;
