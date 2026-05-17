/**
 * @file     src/middlewares/requestId.middleware.js
 * @desc     Request correlation ID middleware.
 *
 *           Assigns a unique UUID v4 to every incoming HTTP request.
 *           The ID is:
 *             1. Attached to req.requestId (available to all downstream middleware)
 *             2. Sent in the X-Request-Id response header (clients can correlate)
 *             3. Bound to a child logger at req.log (request-scoped log context)
 *
 *           Request-scoped logging pattern:
 *             All log lines emitted within a single request lifecycle carry the
 *             same requestId. This is the primary mechanism for tracing a
 *             request through service logs without an external tracer.
 *
 *           External ID propagation:
 *             If the incoming request already carries an X-Request-Id header
 *             (from an API gateway, load balancer, or upstream service), that
 *             ID is used instead of generating a new one. This preserves
 *             correlation across service boundaries.
 *
 *           RULE: This middleware must be registered FIRST in app.js —
 *                 before any other middleware or route handler — so that
 *                 req.log is available everywhere downstream.
 *
 *           Exported:
 *             requestIdMiddleware — Express middleware function
 *
 * @author   Adesh
 * @created  2026-05-03
 */

// ----------------------------------------------------------------------
/* Imports */
import { v4 as uuidv4 } from "uuid";
import { logger } from "../utils/logger.util.js";

// ----------------------------------------------------------------------

/**
 * Express middleware that assigns a correlation ID to every request.
 *
 * @param  {import('express').Request}  req
 * @param  {import('express').Response} res
 * @param  {import('express').NextFunction} next
 * @returns {void}
 */
export const requestIdMiddleware = (req, res, next) => {
  // Honour incoming X-Request-Id from upstream services / API gateways
  const incomingId = req.headers["x-request-id"];
  const requestId =
    typeof incomingId === "string" && incomingId.trim()
      ? incomingId.trim()
      : uuidv4();

  // Attach to request object — accessible to all downstream handlers
  req.requestId = requestId;

  // Set response header so clients can correlate their request
  res.setHeader("X-Request-Id", requestId);

  // Bind a child logger scoped to this request.
  // Every call to req.log.info(), req.log.error(), etc. will automatically
  // include { requestId } in the log output.
  req.log = logger.child({
    requestId,
    method: req.method,
    url: req.originalUrl,
  });

  // Log the incoming request at info level — timing will be added in
  // Phase 23 when response-time tracking is introduced.
  req.log.info("→ Incoming request");

  // Log when the response finishes
  res.on("finish", () => {
    const level =
      res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";
    req.log[level]({ statusCode: res.statusCode }, "← Response sent");
  });

  next();
};
