/**
 * routes/webhook/livekit.route.js
 *
 * PUBLIC route — no JWT auth.
 * Security = LiveKit HMAC signature verification in the controller.
 *
 * IMPORTANT: We capture the raw request body here BEFORE any JSON parsing.
 * The raw body is required to verify LiveKit's HMAC signature.
 * express.json() in app.lib.js would have already parsed the body for other routes,
 * but we use a custom rawBody capture here for this route only.
 */

import { Router } from "express";
import { livekitWebhookHandler } from "../../controllers/webhook/livekit.controller.js";

const LiveKitWebhookRoutes = Router();

LiveKitWebhookRoutes.post(
  "/",
  // Capture raw body for signature verification
  (req, res, next) => {
    let rawData = "";
    req.on("data", (chunk) => {
      rawData += chunk.toString();
    });
    req.on("end", () => {
      req.rawBody = rawData;
      try {
        req.body = JSON.parse(rawData);
      } catch {
        req.body = {};
      }
      next();
    });
  },
  livekitWebhookHandler,
);

export default LiveKitWebhookRoutes;
