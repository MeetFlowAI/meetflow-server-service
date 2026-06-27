/**
 * controllers/webhook/ai.controller.js
 *
 * Receives HMAC-SHA256 signed pipeline callbacks from the AI service.
 *
 * Fix applied: Buffer encoding bug — both buffers must be decoded as hex
 * (not utf-8) for timingSafeEqual to work correctly.
 *
 * Pattern: always 200 immediately, process async.
 * external_id format: "{tenantSchema}__{meetingId}"
 */

import crypto from "crypto";
import { envConfig } from "../../config/env.config.js";
import { initTenantModels } from "../../models/index.js";
import { getAIMeetingTasks } from "../../services/ai/ai.service.js";
import { bulkCreateTasks } from "../../repositories/workspace/task.repository.js";

// ─── Signature verification (FIXED) ──────────────────────────────────────────
const verify = (rawBody, sig, secret) => {
  if (!rawBody || !sig || !secret) return false;
  try {
    const expected = crypto
      .createHmac("sha256", secret)
      .update(rawBody, "utf8")
      .digest("hex");

    // FIX: decode both as hex buffers (32 bytes each).
    return crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(sig, "hex"),
    );
  } catch {
    return false;
  }
};

// ─── Event → ai_status mapping ────────────────────────────────────────────────
const EVENT_TO_UPDATE = {
  "transcription.completed": {
    ai_status: "processing",
    ai_stage: "speaker_identification",
  },
  "speakers.identified": {
    ai_status: "processing",
    ai_stage: "task_extraction",
  },
  "tasks.ready_for_review": {
    ai_status: "pending_review",
    ai_stage: "pending_review",
  },
  "review.completed": { ai_status: "processing", ai_stage: "summarization" },
  "processing.completed": { ai_status: "completed", ai_stage: "completed" },
  "processing.failed": { ai_status: "failed", ai_stage: "failed" },
};

// ─── Save approved AI tasks to the tasks table ────────────────────────────────
/**
 * Called after processing.completed.
 * Fetches finalized tasks from the AI service and bulk-inserts them
 * into the tenant's tasks table with source="ai".
 *
 * Non-fatal — a failure here must never affect the meeting status update.
 */
const persistAITasks = async (tenantSchema, backendMeetingId) => {
  try {
    const db = initTenantModels(tenantSchema);

    // Fetch meeting to get channel_id, workspace_id, started_by_id, ai_meeting_id
    const meeting = await db.Meeting.findOne({
      where: { id: backendMeetingId },
      attributes: [
        "id",
        "channel_id",
        "workspace_id",
        "started_by_id",
        "ai_meeting_id",
      ],
    });

    if (!meeting?.ai_meeting_id) {
      console.warn(
        `⚠️  persistAITasks: meeting ${backendMeetingId} has no ai_meeting_id — skipping`,
      );
      return;
    }

    // Get finalised tasks from AI service
    const aiData = await getAIMeetingTasks(meeting.ai_meeting_id);
    const aiTasks = aiData?.tasks ?? [];

    if (aiTasks.length === 0) {
      console.log(
        `ℹ️  persistAITasks: no tasks returned for meeting ${backendMeetingId}`,
      );
      return;
    }

    // Map AI task shape → DB task shape
    const VALID_PRIORITIES = new Set(["low", "medium", "high"]);

    const taskRows = aiTasks.map((t) => ({
      channel_id: meeting.channel_id,
      workspace_id: meeting.workspace_id,
      meeting_id: meeting.id,
      title: t.title,
      description: t.description || null,
      status: "todo",
      priority: VALID_PRIORITIES.has(t.priority) ? t.priority : "medium",
      assigned_to_id: null, // AI returns assignee_name; no reliable email→userId mapping yet
      created_by_id: meeting.started_by_id,
      due_date: t.deadline || null,
      source: "ai",
    }));

    await bulkCreateTasks(tenantSchema, taskRows);

    console.log(
      `✅ persistAITasks: saved ${taskRows.length} AI tasks for meeting ${backendMeetingId} (schema: ${tenantSchema})`,
    );
  } catch (err) {
    // Non-fatal — log and continue
    console.error(
      `❌ persistAITasks failed for meeting ${backendMeetingId}: ${err.message}`,
    );
  }
};

// ─── Handler ──────────────────────────────────────────────────────────────────
export const aiWebhookHandler = async (req, res) => {
  // Always 200 immediately — AI service retries on non-2xx
  res.status(200).json({ received: true });

  try {
    const sig = req.headers["x-webhook-signature"];
    if (!sig) {
      console.warn("❌ AI webhook: missing x-webhook-signature header");
      return;
    }

    const isValid = verify(req.rawBody, sig, envConfig.AI_WEBHOOK_SECRET);
    if (!isValid) {
      const expected = crypto
        .createHmac("sha256", envConfig.AI_WEBHOOK_SECRET)
        .update(req.rawBody, "utf8")
        .digest("hex");
      console.warn(`❌ AI webhook: signature mismatch`);
      console.warn(`   received : ${sig?.substring(0, 16)}...`);
      console.warn(`   expected : ${expected?.substring(0, 16)}...`);
      return;
    }

    const { event_type, external_id, meeting_id: aiMeetingId } = req.body;

    if (!external_id) {
      console.warn("⚠️ AI webhook: missing external_id — cannot route");
      return;
    }

    // Parse "{tenantSchema}__{meetingId}"
    const separatorIdx = external_id.indexOf("__");
    if (separatorIdx === -1) {
      console.warn(`⚠️ AI webhook: malformed external_id "${external_id}"`);
      return;
    }

    const tenantSchema = external_id.substring(0, separatorIdx);
    const backendMeetingId = parseInt(
      external_id.substring(separatorIdx + 2),
      10,
    );

    if (!tenantSchema || isNaN(backendMeetingId)) {
      console.warn(
        `⚠️ AI webhook: could not parse external_id "${external_id}"`,
      );
      return;
    }

    const updatePayload = EVENT_TO_UPDATE[event_type];
    if (!updatePayload) {
      console.log(`ℹ️ AI webhook: unhandled event "${event_type}" — skipping`);
      return;
    }

    const db = initTenantModels(tenantSchema);
    const [rowsUpdated] = await db.Meeting.update(updatePayload, {
      where: { id: backendMeetingId },
    });

    // ── Push real-time update to any open SSE connections ─────────────────────
    const { sseClients } = await import("../workspace/meeting.controller.js");
    const clients = sseClients.get(String(backendMeetingId));
    if (clients?.size > 0) {
      const payload = `data: ${JSON.stringify(updatePayload)}\n\n`;
      for (const client of clients) {
        try {
          client.write(payload);
        } catch {}
      }
    }

    if (rowsUpdated === 0) {
      console.warn(
        `⚠️ AI webhook: meeting ${backendMeetingId} not found in schema "${tenantSchema}"`,
      );
      return;
    }

    console.log(
      `🔔 AI webhook: meeting ${backendMeetingId} → ai_status="${updatePayload.ai_status}" stage="${updatePayload.ai_stage}" (${event_type})`,
    );

    // ── On completion: persist AI-extracted tasks to the tasks table ──────────
    // Runs after the status update so the meeting record is already committed.
    // Non-blocking — any failure here is logged but does not affect the response.
    if (event_type === "processing.completed") {
      await persistAITasks(tenantSchema, backendMeetingId);
    }
  } catch (err) {
    console.error("❌ AI webhook processing error:", err.message);
  }
};