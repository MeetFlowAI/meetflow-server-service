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

// Fix: added network error handling (was missing try/catch on fetch)
const aiFetch = async (method, path, body = null) => {
  const opts = { method, headers: aiHeaders() };
  if (body) opts.body = JSON.stringify(body);

  let res;
  try {
    res = await fetch(`${AI_BASE}${path}`, opts);
  } catch (networkErr) {
    throw Object.assign(
      new Error(`AI Service unreachable (${path}): ${networkErr.message}`),
      { statusCode: 503 }
    );
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw Object.assign(
      new Error(`AI Service ${res.status}: ${text}`),
      { statusCode: res.status }
    );
  }
  return res.json();
};

// ── Provision workspace in AI service ──────────────────────────────────────
export const provisionAIWorkspace = async ({ workspaceName, webhookUrl }) => {
  return aiFetch("POST", "/api/v1/channels", {
    name: workspaceName,
    webhook_url: webhookUrl,
  });
};

// NOTE: enrollVoiceprintInAI removed — enrollment uses axios directly in
// controllers/workspace/ai.controller.js to correctly handle multipart/form-data
// with FastAPI. Do NOT add it back here.

// ── Trigger AI pipeline after meeting ends ────────────────────────────────
export const triggerAIPipeline = async ({
  audioUrl,
  aiChannelId,
  externalId,
  meetingType,
  participantIds,
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
