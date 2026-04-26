import { initTenantModels } from "../../models/index.js";
import {
  getAIMeetingTasks,
  getAIMeetingTranscript,
  getAIMeetingSummary,
  submitAIReview,
  getAIPipelineStatus,
} from "../../services/ai/ai.service.js";
import { successResponse, errorResponse } from "../../utils/response.util.js";
import { STATUS_CODES, RESPONSE_MESSAGES } from "../../constants/response.js";

// Helper: get meeting + verify it has an AI meeting ID
const getMeetingWithAI = async (tenantSchema, meetingId) => {
  const db = initTenantModels(tenantSchema);
  const meeting = await db.Meeting.findOne({ where: { id: meetingId } });
  if (!meeting)
    throw Object.assign(new Error("Meeting not found"), { statusCode: 404 });
  if (!meeting.ai_meeting_id)
    throw Object.assign(
      new Error("AI processing not triggered for this meeting"),
      { statusCode: 404 },
    );
  return meeting;
};

// GET /workspace/:wid/channels/:cid/meetings/:mid/ai-status
export const getAIStatus = async (req, res) => {
  try {
    const meeting = await getMeetingWithAI(
      req.user.tenantSchema,
      req.params.meetingId,
    );
    const aiStatus = await getAIPipelineStatus(meeting.ai_meeting_id);
    return successResponse(
      res,
      STATUS_CODES.OK,
      RESPONSE_MESSAGES.SUCCESS,
      "AI status",
      {
        ai_status: meeting.ai_status,
        ai_meeting_id: meeting.ai_meeting_id,
        pipeline: aiStatus,
      },
    );
  } catch (err) {
    return errorResponse(
      res,
      err.statusCode || STATUS_CODES.SERVER_ERROR,
      RESPONSE_MESSAGES.ERROR,
      err.message,
    );
  }
};

// GET /workspace/:wid/channels/:cid/meetings/:mid/ai-tasks
export const getAITasks = async (req, res) => {
  try {
    const meeting = await getMeetingWithAI(
      req.user.tenantSchema,
      req.params.meetingId,
    );
    if (!["pending_review", "completed"].includes(meeting.ai_status)) {
      return errorResponse(
        res,
        409,
        RESPONSE_MESSAGES.ERROR,
        `AI status is '${meeting.ai_status}'. Tasks available only after processing.`,
      );
    }
    const tasks = await getAIMeetingTasks(meeting.ai_meeting_id);
    return successResponse(
      res,
      STATUS_CODES.OK,
      RESPONSE_MESSAGES.SUCCESS,
      "Tasks retrieved",
      tasks,
    );
  } catch (err) {
    return errorResponse(
      res,
      err.statusCode || STATUS_CODES.SERVER_ERROR,
      RESPONSE_MESSAGES.ERROR,
      err.message,
    );
  }
};

// POST /workspace/:wid/channels/:cid/meetings/:mid/ai-review
export const submitAIMeetingReview = async (req, res) => {
  try {
    const meeting = await getMeetingWithAI(
      req.user.tenantSchema,
      req.params.meetingId,
    );
    if (meeting.ai_status !== "pending_review") {
      return errorResponse(
        res,
        409,
        RESPONSE_MESSAGES.ERROR,
        `Meeting AI status is '${meeting.ai_status}', expected 'pending_review'`,
      );
    }
    const result = await submitAIReview(meeting.ai_meeting_id, {
      ...req.body,
      reviewer_id: String(req.user.userId),
    });
    return successResponse(
      res,
      STATUS_CODES.OK,
      RESPONSE_MESSAGES.SUCCESS,
      "Review submitted",
      result,
    );
  } catch (err) {
    return errorResponse(
      res,
      err.statusCode || STATUS_CODES.SERVER_ERROR,
      RESPONSE_MESSAGES.ERROR,
      err.message,
    );
  }
};

// GET /workspace/:wid/channels/:cid/meetings/:mid/ai-transcript
export const getAITranscript = async (req, res) => {
  try {
    const meeting = await getMeetingWithAI(
      req.user.tenantSchema,
      req.params.meetingId,
    );
    const transcript = await getAIMeetingTranscript(meeting.ai_meeting_id);
    return successResponse(
      res,
      STATUS_CODES.OK,
      RESPONSE_MESSAGES.SUCCESS,
      "Transcript retrieved",
      transcript,
    );
  } catch (err) {
    return errorResponse(
      res,
      err.statusCode || STATUS_CODES.SERVER_ERROR,
      RESPONSE_MESSAGES.ERROR,
      err.message,
    );
  }
};

// GET /workspace/:wid/channels/:cid/meetings/:mid/ai-summary
export const getAISummary = async (req, res) => {
  try {
    const meeting = await getMeetingWithAI(
      req.user.tenantSchema,
      req.params.meetingId,
    );
    if (meeting.ai_status !== "completed") {
      return errorResponse(
        res,
        409,
        RESPONSE_MESSAGES.ERROR,
        `Summary available only after completion. Current status: '${meeting.ai_status}'`,
      );
    }
    const summary = await getAIMeetingSummary(meeting.ai_meeting_id);
    return successResponse(
      res,
      STATUS_CODES.OK,
      RESPONSE_MESSAGES.SUCCESS,
      "Summary retrieved",
      summary,
    );
  } catch (err) {
    return errorResponse(
      res,
      err.statusCode || STATUS_CODES.SERVER_ERROR,
      RESPONSE_MESSAGES.ERROR,
      err.message,
    );
  }
};

// POST /workspace/:wid/enroll-voice — voiceprint enrollment
export const enrollVoice = async (req, res) => {
  try {
    const { tenantSchema, userId } = req.user;
    const { workspaceId } = req.params;

    const db = initTenantModels(tenantSchema);

    // Get workspace AI channel ID
    const workspace = await db.Workspace.findOne({
      where: { id: workspaceId },
    });
    if (!workspace?.ai_channel_id) {
      return errorResponse(
        res,
        404,
        RESPONSE_MESSAGES.ERROR,
        "Workspace AI context not provisioned yet",
      );
    }

    // Get user details
    const user = await db.User.findOne({ where: { id: userId } });
    const wm = await db.WorkspaceMember.findOne({
      where: { workspace_id: workspaceId, user_id: userId },
    });

    // Build FormData with user info + audio clips from req.files
    const { FormData, Blob } = await import("formdata-node");
    const form = new FormData();
    form.set("name", `${user.first_name} ${user.last_name}`.trim());
    form.set("email", user.email);
    form.set("role", wm?.role || "member");
    form.set("external_id", String(userId));

    // req.files is array from multer
    for (const file of req.files) {
      form.set(
        "audio_clips",
        new Blob([file.buffer], { type: file.mimetype }),
        file.originalname,
      );
    }

    const { enrollVoiceprintInAI } =
      await import("../../services/ai/ai.service.js");
    const result = await enrollVoiceprintInAI(workspace.ai_channel_id, form);

    // Save AI participant ID on workspace member
    await db.WorkspaceMember.update(
      { ai_participant_id: result.participant_id, voice_enrolled: true },
      { where: { workspace_id: workspaceId, user_id: userId } },
    );

    return successResponse(
      res,
      STATUS_CODES.OK,
      RESPONSE_MESSAGES.SUCCESS,
      "Voice enrolled successfully",
      result,
    );
  } catch (err) {
    return errorResponse(
      res,
      err.statusCode || STATUS_CODES.SERVER_ERROR,
      RESPONSE_MESSAGES.ERROR,
      err.message,
      err,
    );
  }
};
