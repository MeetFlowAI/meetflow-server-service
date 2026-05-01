import { Router } from "express";
import * as MeetingController from "../../controllers/workspace/meeting.controller.js";
import {
  authenticate,
  requireOrgContext,
} from "../../middlewares/auth.middleware.js";
import { validate } from "../../validators/index.js";
import { startMeetingSchema } from "../../validators/workspace/meeting.validator.js";

const MeetingRoutes = Router({ mergeParams: true });

// ── Authenticated routes ───────────────────────────────────────────────────────
MeetingRoutes.post(
  "/start",
  authenticate,
  requireOrgContext,
  validate(startMeetingSchema),
  MeetingController.startMeeting,
);

MeetingRoutes.post(
  "/:meetingId/join",
  authenticate,
  requireOrgContext,
  MeetingController.joinMeeting,
);

MeetingRoutes.post(
  "/:meetingId/end",
  authenticate,
  requireOrgContext,
  MeetingController.endMeeting,
);

MeetingRoutes.get(
  "/",
  authenticate,
  requireOrgContext,
  MeetingController.getMeetings,
);

MeetingRoutes.get(
  "/:meetingId",
  authenticate,
  requireOrgContext,
  MeetingController.getMeetingDetail,
);

MeetingRoutes.get(
  "/:meetingId/status-stream",
  authenticate,
  requireOrgContext,
  MeetingController.meetingStatusStream,
);

export default MeetingRoutes;
