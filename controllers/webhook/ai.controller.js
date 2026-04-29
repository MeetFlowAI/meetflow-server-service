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

// ─── Signature verification (FIXED) ──────────────────────────────────────────
const verify = (rawBody, sig, secret) => {
  if (!rawBody || !sig || !secret) return false;
  try {
    const expected = crypto
      .createHmac("sha256", secret)
      .update(rawBody, "utf8")
      .digest("hex");

    // FIX: decode both as hex buffers (32 bytes each).
    // Previously Buffer.from(str) used utf8 encoding giving 64-byte buffers
    // that may pass or fail depending on string content — not cryptographically safe.
    return crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(sig, "hex")
    );
  } catch {
    return false;
  }
};

// ─── Event → ai_status mapping ────────────────────────────────────────────────
const EVENT_TO_STATUS = {
  "transcription.completed": "processing",
  "speakers.identified":     "processing",
  "tasks.ready_for_review":  "pending_review",
  "review.completed":        "processing",
  "processing.completed":    "completed",
  "processing.failed":       "failed",
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
      // Debug helper — log both sides so you can verify format during testing
      const expected = crypto
        .createHmac("sha256", envConfig.AI_WEBHOOK_SECRET)
        .update(req.rawBody, "utf8")
        .digest("hex");
      console.warn(`❌ AI webhook: signature mismatch`);
      console.warn(`   received : ${sig?.substring(0, 16)}...`);
      console.warn(`   expected : ${expected?.substring(0, 16)}...`);
      return;
    }

    const {
      event_type,
      external_id,
      meeting_id: aiMeetingId,
    } = req.body;

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
      10
    );

    if (!tenantSchema || isNaN(backendMeetingId)) {
      console.warn(`⚠️ AI webhook: could not parse external_id "${external_id}"`);
      return;
    }

    const newAiStatus = EVENT_TO_STATUS[event_type];
    if (!newAiStatus) {
      console.log(`ℹ️ AI webhook: unhandled event "${event_type}" — skipping`);
      return;
    }

    const db = initTenantModels(tenantSchema);
    const [rowsUpdated] = await db.Meeting.update(
      { ai_status: newAiStatus },
      { where: { id: backendMeetingId } }
    );

    if (rowsUpdated === 0) {
      console.warn(
        `⚠️ AI webhook: meeting ${backendMeetingId} not found in schema "${tenantSchema}"`
      );
      return;
    }

    console.log(
      `🔔 AI webhook: meeting ${backendMeetingId} → ai_status="${newAiStatus}" (${event_type})`
    );
  } catch (err) {
    console.error("❌ AI webhook processing error:", err.message);
  }
};
