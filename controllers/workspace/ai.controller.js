/**
 * controllers/workspace/ai.controller.js
 *
 * Proxy layer between the frontend and the AI service.
 *
 * Each handler:
 *  1. Verifies the user has access to the workspace/meeting
 *  2. Looks up ai_meeting_id from the backend meeting record
 *  3. Forwards the request to the AI service
 *  4. Returns the result to the frontend
 *
 * This keeps the AI service fully internal — the frontend never
 * calls the AI service directly.
 */

import { initTenantModels } from "../../models/index.js";
import {
  getAIPipelineStatus,
  getAIMeetingTasks,
  getAIMeetingTranscript,
  getAIMeetingSummary,
  submitAIReview,
} from "../../services/ai/ai.service.js";
import { successResponse, errorResponse } from "../../utils/response.util.js";
import { STATUS_CODES, RESPONSE_MESSAGES } from "../../constants/response.js";
import * as WorkspaceRepository from "../../repositories/workspace/workspace.repository.js";
import { envConfig } from "../../config/env.config.js";

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Fetch meeting and verify it has an ai_meeting_id.
 * Throws an error with statusCode if not found or not triggered.
 */
const getMeetingWithAI = async (tenantSchema, meetingId) => {
  const db = initTenantModels(tenantSchema);
  const meeting = await db.Meeting.findOne({ where: { id: meetingId } });

  if (!meeting) {
    throw Object.assign(new Error("Meeting not found."), { statusCode: 404 });
  }
  if (!meeting.ai_meeting_id) {
    throw Object.assign(
      new Error(
        "AI processing has not been triggered for this meeting. " +
          "The meeting may not have a recording yet.",
      ),
      { statusCode: 404 },
    );
  }
  return meeting;
};

// ─── GET ai-status ────────────────────────────────────────────────────────────

export const getAIStatus = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { tenantSchema } = req.user;

    const meeting = await getMeetingWithAI(tenantSchema, meetingId);
    const pipeline = await getAIPipelineStatus(meeting.ai_meeting_id);

    return successResponse(
      res,
      STATUS_CODES.OK,
      RESPONSE_MESSAGES.SUCCESS,
      "AI status retrieved",
      {
        ai_status: meeting.ai_status,
        ai_meeting_id: meeting.ai_meeting_id,
        pipeline,
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

// ─── GET ai-tasks ─────────────────────────────────────────────────────────────

export const getAITasks = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { tenantSchema } = req.user;

    const meeting = await getMeetingWithAI(tenantSchema, meetingId);

    if (!["pending_review", "completed"].includes(meeting.ai_status)) {
      return errorResponse(
        res,
        STATUS_CODES.CONFLICT,
        RESPONSE_MESSAGES.ERROR,
        `Tasks are not ready yet. Current AI status: '${meeting.ai_status}'.`,
      );
    }

    const tasks = await getAIMeetingTasks(meeting.ai_meeting_id);
    return successResponse(
      res,
      STATUS_CODES.OK,
      RESPONSE_MESSAGES.SUCCESS,
      "Tasks retrieved successfully",
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

// ─── POST ai-review ───────────────────────────────────────────────────────────

export const submitAIMeetingReview = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { tenantSchema, userId } = req.user;

    const meeting = await getMeetingWithAI(tenantSchema, meetingId);

    if (meeting.ai_status !== "pending_review") {
      return errorResponse(
        res,
        STATUS_CODES.CONFLICT,
        RESPONSE_MESSAGES.ERROR,
        `Cannot submit review. AI status is '${meeting.ai_status}', expected 'pending_review'.`,
      );
    }

    const result = await submitAIReview(meeting.ai_meeting_id, {
      ...req.body,
      reviewer_id: String(userId),
    });

    return successResponse(
      res,
      STATUS_CODES.OK,
      RESPONSE_MESSAGES.SUCCESS,
      "Review submitted successfully. Summary generation has started.",
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

// ─── GET ai-transcript ────────────────────────────────────────────────────────

export const getAITranscript = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { tenantSchema } = req.user;

    const meeting = await getMeetingWithAI(tenantSchema, meetingId);
    const transcript = await getAIMeetingTranscript(meeting.ai_meeting_id);

    return successResponse(
      res,
      STATUS_CODES.OK,
      RESPONSE_MESSAGES.SUCCESS,
      "Transcript retrieved successfully",
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

// ─── GET ai-summary ───────────────────────────────────────────────────────────

export const getAISummary = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { tenantSchema } = req.user;

    const meeting = await getMeetingWithAI(tenantSchema, meetingId);

    if (meeting.ai_status !== "completed") {
      return errorResponse(
        res,
        STATUS_CODES.CONFLICT,
        RESPONSE_MESSAGES.ERROR,
        `Summary is not available yet. Current AI status: '${meeting.ai_status}'.`,
      );
    }

    const summary = await getAIMeetingSummary(meeting.ai_meeting_id);
    return successResponse(
      res,
      STATUS_CODES.OK,
      RESPONSE_MESSAGES.SUCCESS,
      "Summary retrieved successfully",
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

// ─── POST enroll-voice ────────────────────────────────────────────────────────

export const enrollVoice = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { tenantSchema, userId } = req.user;

    const db = initTenantModels(tenantSchema);

    // Get workspace — need ai_channel_id
    const workspace = await WorkspaceRepository.getWorkspaceById(
      tenantSchema,
      workspaceId,
    );
    if (!workspace) {
      return errorResponse(
        res,
        STATUS_CODES.NOT_FOUND,
        RESPONSE_MESSAGES.ERROR,
        "Workspace not found.",
      );
    }
    if (!workspace.ai_channel_id) {
      return errorResponse(
        res,
        STATUS_CODES.NOT_FOUND,
        RESPONSE_MESSAGES.ERROR,
        "AI context has not been provisioned for this workspace yet. Please try again in a few moments.",
      );
    }

    // Get user details for name/email
    const user = await db.User.findOne({
      where: { id: userId },
      attributes: ["id", "first_name", "last_name", "email"],
    });
    if (!user) {
      return errorResponse(
        res,
        STATUS_CODES.NOT_FOUND,
        RESPONSE_MESSAGES.ERROR,
        "User not found.",
      );
    }

    // Get workspace member for role
    const wm = await db.WorkspaceMember.findOne({
      where: { workspace_id: workspaceId, user_id: userId },
    });

    // req.files comes from multer (array of audio clips)
    if (!req.files || req.files.length < 1) {
      return errorResponse(
        res,
        STATUS_CODES.BAD_REQUEST,
        RESPONSE_MESSAGES.BAD_REQUEST,
        "At least 1 audio clip is required. Please provide 3–5 clips for best accuracy.",
      );
    }

    // Build FormData using the 'form-data' npm package.
    // Node.js built-in FormData does NOT correctly serialise multiple files
    // under the same field name when piped through fetch — the AI service
    // ends up receiving only 1 file. form-data handles this correctly.
    const FormDataLib = (await import("form-data")).default;
    const formData = new FormDataLib();

    formData.append("name", `${user.first_name} ${user.last_name}`.trim());
    formData.append("email", user.email);
    formData.append("role", wm?.role || "member");
    formData.append("external_id", String(userId));

    // Each clip is appended as a separate "audio_clips" part with its own filename
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      formData.append("audio_clips", file.buffer, {
        filename: file.originalname || `clip_${i + 1}.webm`,
        contentType: file.mimetype || "audio/webm",
        knownLength: file.buffer.length,
      });
    }

    // Forward directly — must use formData.getHeaders() so the boundary is set correctly
    const AI_BASE = envConfig.AI_SERVICE_URL;
    const AI_KEY = envConfig.AI_SERVICE_INTERNAL_KEY;

    let aiRes;
    try {
      aiRes = await fetch(
        `${AI_BASE}/api/v1/channels/${workspace.ai_channel_id}/enroll`,
        {
          method: "POST",
          headers: {
            ...formData.getHeaders(), // Content-Type: multipart/form-data; boundary=---xxx
            "X-Internal-Key": AI_KEY,
          },
          body: formData,
        },
      );
    } catch (networkErr) {
      throw Object.assign(
        new Error(`AI Service unreachable: ${networkErr.message}`),
        { statusCode: 503 },
      );
    }

    if (!aiRes.ok) {
      const text = await aiRes.text().catch(() => "");
      throw Object.assign(
        new Error(`Enrollment failed (${aiRes.status}): ${text}`),
        { statusCode: aiRes.status },
      );
    }

    const result = await aiRes.json();

    // Save AI participant ID and mark voice_enrolled = true
    await db.WorkspaceMember.update(
      {
        ai_participant_id: result.participant_id,
        voice_enrolled: true,
      },
      { where: { workspace_id: workspaceId, user_id: userId } },
    );

    return successResponse(
      res,
      STATUS_CODES.OK,
      RESPONSE_MESSAGES.SUCCESS,
      "Voice enrolled successfully! You will now be recognized in meetings.",
      {
        participant_id: result.participant_id,
        status: result.status,
        quality_score: result.enrollment_quality_score,
        issues: result.issues || [],
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
