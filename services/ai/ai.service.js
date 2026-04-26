/**
 * services/ai/ai.service.js
 * All HTTP calls to the AI service go through here.
 */

import { envConfig } from "../../config/env.config.js";

const AI_BASE = envConfig.AI_SERVICE_URL;
const AI_KEY = envConfig.AI_SERVICE_INTERNAL_KEY;

const aiHeaders = () => ({
  "Content-Type": "application/json",
  "X-Internal-Key": AI_KEY,
});

const aiFetch = async (method, path, body = null) => {
  const opts = { method, headers: aiHeaders() };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${AI_BASE}${path}`, opts);
  if (!res.ok) {
    const text = await res.text();
    throw Object.assign(new Error(`AI Service ${res.status}: ${text}`), {
      statusCode: res.status,
    });
  }
  return res.json();
};

// ── Provision workspace in AI service ──────────────────────────────────────
export const provisionAIWorkspace = async ({ workspaceName, webhookUrl }) => {
  return aiFetch("POST", "/api/v1/channels", {
    name: workspaceName,
    webhook_url: webhookUrl,
  });
  // Returns: { channel_id: UUID, created_at: string }
};

// ── Enroll voiceprint (multipart — caller provides FormData) ──────────────
export const enrollVoiceprintInAI = async (aiChannelId, formData) => {
  const res = await fetch(
    `${AI_BASE}/api/v1/channels/${aiChannelId}/enroll`,
    {
      method: "POST",
      headers: { "X-Internal-Key": AI_KEY },
      // Do NOT set Content-Type — fetch sets it with correct boundary
      body: formData,
    }
  );
  if (!res.ok) {
    const text = await res.text();
    throw Object.assign(new Error(`Enrollment failed: ${text}`), {
      statusCode: res.status,
    });
  }
  return res.json();
  // Returns: { participant_id: UUID, status: "enrolled", enrollment_quality_score: 0.87 }
};

// ── Trigger AI pipeline after meeting ends ────────────────────────────────
export const triggerAIPipeline = async ({
  audioUrl,
  aiChannelId,
  externalId,    // "{tenantSchema}__{meetingId}" — used to route webhook back
  meetingType,
  participantIds, // array of AI participant UUIDs
  webhookUrl,
  languageCode = "en-IN",
}) => {
  return aiFetch("POST", "/api/v1/meetings", {
    audio_url: audioUrl,
    channel_id: aiChannelId,
    external_id: externalId,
    meeting_type: meetingType || "general",
    participants: participantIds.map((id) => ({ id })),
    webhook_url: webhookUrl,
    language_code: languageCode,
    auto_detect_speakers: participantIds.length === 0,
  });
  // Returns: { meeting_id: UUID, status: "pending" }
};

// ── Get pipeline status ──────────────────────────────────────────────────
export const getAIPipelineStatus = async (aiMeetingId) => {
  return aiFetch("GET", `/api/v1/meetings/${aiMeetingId}/status`);
};

// ── Get tasks for review ─────────────────────────────────────────────────
export const getAIMeetingTasks = async (aiMeetingId) => {
  return aiFetch("GET", `/api/v1/meetings/${aiMeetingId}/tasks`);
};

// ── Get transcript ────────────────────────────────────────────────────────
export const getAIMeetingTranscript = async (aiMeetingId) => {
  return aiFetch("GET", `/api/v1/meetings/${aiMeetingId}/transcript`);
};

// ── Get summary ──────────────────────────────────────────────────────────
export const getAIMeetingSummary = async (aiMeetingId) => {
  return aiFetch("GET", `/api/v1/meetings/${aiMeetingId}/summary`);
};

// ── Submit human review ──────────────────────────────────────────────────
export const submitAIReview = async (aiMeetingId, reviewPayload) => {
  return aiFetch("POST", `/api/v1/meetings/${aiMeetingId}/review`, reviewPayload);
};