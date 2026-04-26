import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import multer from "multer";
import {
  getAIStatus,
  getAITasks,
  submitAIMeetingReview,
  getAITranscript,
  getAISummary,
  enrollVoice,
} from "../../controllers/workspace/ai.controller.js";

const AIRoutes = Router({ mergeParams: true });
const upload = multer({ storage: multer.memoryStorage() });

// Meeting AI endpoints — all under /:workspaceId/channels/:channelId/meetings/:meetingId/
AIRoutes.get("/:meetingId/ai-status", authenticate, getAIStatus);
AIRoutes.get("/:meetingId/ai-tasks", authenticate, getAITasks);
AIRoutes.post("/:meetingId/ai-review", authenticate, submitAIMeetingReview);
AIRoutes.get("/:meetingId/ai-transcript", authenticate, getAITranscript);
AIRoutes.get("/:meetingId/ai-summary", authenticate, getAISummary);

export default AIRoutes;
