/**
 * routes/chat/stream.route.js
 *
 * All routes require a valid org JWT (authenticate + requireOrgContext).
 *
 * Base: /api/v1/chat
 */

import { Router } from "express";
import * as StreamController from "../../controllers/chat/stream.controller.js";
import {
  authenticate,
  requireOrgContext,
} from "../../middlewares/auth.middleware.js";

const StreamRoutes = Router();

StreamRoutes.use(authenticate, requireOrgContext);

// ── Token ─────────────────────────────────────────────────────────────────────
// Frontend calls this once after login to get the Stream connection token
StreamRoutes.get("/token", StreamController.getChatToken);

// ── Channel provisioning ──────────────────────────────────────────────────────
// Mirror a workspace channel into Stream
StreamRoutes.post("/channels", StreamController.provisionChannel);

// Add/remove members from a Stream channel
StreamRoutes.post(
  "/channels/:streamChannelId/members",
  StreamController.addMember,
);
StreamRoutes.delete(
  "/channels/:streamChannelId/members/:userId",
  StreamController.removeMember,
);

// ── Direct Messages ───────────────────────────────────────────────────────────
// Get or create a DM channel between current user and target_user_id
StreamRoutes.post("/dm", StreamController.createDM);

// ── Meeting Chat ──────────────────────────────────────────────────────────────
// Create an in-meeting chat channel when a meeting starts
StreamRoutes.post("/meeting-channel", StreamController.createMeetingChannel);

// ── Workspace sync ────────────────────────────────────────────────────────────
// Sync all workspace channels to Stream (idempotent — safe to call anytime)
StreamRoutes.post("/sync-workspace", StreamController.syncWorkspace);

export default StreamRoutes;
