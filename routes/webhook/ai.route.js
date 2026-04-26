import { Router } from "express";
import { aiWebhookHandler } from "../../controllers/webhook/ai.controller.js";

const AIWebhookRoutes = Router();

AIWebhookRoutes.post(
  "/",
  // Capture raw body for HMAC verification
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
  aiWebhookHandler,
);

export default AIWebhookRoutes;
