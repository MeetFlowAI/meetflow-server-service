/**
 * routes/workspace/meeting.route.js
 *
 * Mounted under:
 *   /workspace/:workspaceId/channels/:channelId/meetings
 *
 * mergeParams: true is critical — lets us read :workspaceId and :channelId
 * from the parent router.
 */

import { Router } from "express";
import * as MeetingController from "../../controllers/workspace/meeting.controller.js";
import {
  authenticate,
  requireOrgContext,
} from "../../middlewares/auth.middleware.js";
import { validate } from "../../validators/index.js";
import { startMeetingSchema } from "../../validators/workspace/meeting.validator.js";

const MeetingRoutes = Router({ mergeParams: true });

// All meeting routes require a valid org JWT
MeetingRoutes.use(authenticate, requireOrgContext);

// ── Routes ────────────────────────────────────────────────────────────────────

// Start a new meeting in this channel
// Creates a LiveKit room, returns { meeting, token, livekit_url, livekit_room_name }
MeetingRoutes.post(
  "/start",
  validate(startMeetingSchema),
  MeetingController.startMeeting,
);

// Join an existing active meeting
// Returns { meeting, token, livekit_url, livekit_room_name }
MeetingRoutes.post("/:meetingId/join", MeetingController.joinMeeting);

// End meeting for everyone (host / ws admin / org admin only)
MeetingRoutes.post("/:meetingId/end", MeetingController.endMeeting);

// List meetings for this channel (most recent first, paginated)
MeetingRoutes.get("/", MeetingController.getMeetings);

// Get full meeting detail including participant list
MeetingRoutes.get("/:meetingId", MeetingController.getMeetingDetail);

export default MeetingRoutes;
