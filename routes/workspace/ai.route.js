import { Router } from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
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
AIRoutes.get("/:meetingId/ai-status", authMiddleware, getAIStatus);
AIRoutes.get("/:meetingId/ai-tasks", authMiddleware, getAITasks);
AIRoutes.post("/:meetingId/ai-review", authMiddleware, submitAIMeetingReview);
AIRoutes.get("/:meetingId/ai-transcript", authMiddleware, getAITranscript);
AIRoutes.get("/:meetingId/ai-summary", authMiddleware, getAISummary);

export default AIRoutes;
