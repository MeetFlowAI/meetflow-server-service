import { Router } from "express";
import { successResponse } from "../utils/response.util.js";
import { RESPONSE_MESSAGES, STATUS_CODES } from "../constants/response.js";
import AuthRoutes from "./common/auth.route.js";
import AccountRoutes from "./common/account.route.js";
import MasterRoutes from "./master/index.js";
import OrganizationRoutes from "./organization/index.js";
import WorkspaceRoutes from "./workspace/index.js";
import LiveKitWebhookRoutes from "./webhook/livekit.route.js";
import StreamChatRoutes from "./chat/stream.route.js";
import AIWebhookRoutes from "./webhook/ai.route.js";


const apiRoutes = Router();

apiRoutes.get("/health", async (req, res) => {
  return successResponse(
    res,
    STATUS_CODES.OK,
    RESPONSE_MESSAGES.SUCCESS,
    RESPONSE_MESSAGES.SUCCESS_MESSAGES.HEALTH_CHECK,
    {
      status: "healthy",
      timestamp: new Date(),
      uptime: process.uptime(),
    },
  );
});

apiRoutes.use("/auth", AuthRoutes);
apiRoutes.use("/account", AccountRoutes);
apiRoutes.use("/master", MasterRoutes);
apiRoutes.use("/organization", OrganizationRoutes);
apiRoutes.use("/workspace", WorkspaceRoutes);

// Stream Chat — token, channel provisioning, DMs, meeting chat
apiRoutes.use("/chat", StreamChatRoutes);

// LiveKit webhook — PUBLIC, no JWT, signature-verified internally
// Register this URL in your LiveKit dashboard: Settings → Webhooks
apiRoutes.use("/webhook/livekit", LiveKitWebhookRoutes);

apiRoutes.use("/webhook/ai", AIWebhookRoutes);

export default apiRoutes;
