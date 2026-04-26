import { Router } from "express";
import multer from "multer";
import authMiddleware from "../../middlewares/auth.middleware.js";
import { enrollVoice } from "../../controllers/workspace/ai.controller.js";

const EnrollmentRoutes = Router({ mergeParams: true });
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

// POST /workspace/:workspaceId/enroll-voice
EnrollmentRoutes.post(
  "/",
  authMiddleware,
  upload.array("audio_clips", 5),
  enrollVoice,
);

export default EnrollmentRoutes;
