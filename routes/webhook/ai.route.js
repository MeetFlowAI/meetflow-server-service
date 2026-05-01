import { Router } from "express";
import { aiWebhookHandler } from "../../controllers/webhook/ai.controller.js";

const AIWebhookRoutes = Router();

// rawBody is now set by the global express.json verify callback in app.lib.js
// No need to manually capture the stream here
AIWebhookRoutes.post("/", aiWebhookHandler);

export default AIWebhookRoutes;
