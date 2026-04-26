import crypto from "crypto";
import { envConfig } from "../../config/env.config.js";
import { initTenantModels } from "../../models/index.js";
import { masterDb } from "../../models/index.js";

const verify = (rawBody, sig, secret) => {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
  } catch {
    return false;
  }
};

export const aiWebhookHandler = async (req, res) => {
  // Always 200 immediately — AI service retries on non-2xx
  res.status(200).json({ received: true });

  try {
    const sig = req.headers["x-webhook-signature"];
    if (!sig || !verify(req.rawBody, sig, envConfig.AI_WEBHOOK_SECRET)) {
      console.warn("❌ Invalid AI webhook signature — ignoring");
      return;
    }

    const { event_type, external_id, meeting_id: aiMeetingId } = req.body;
    if (!external_id) return;

    // external_id format: "{tenantSchema}__{meetingId}"
    const separatorIdx = external_id.indexOf("__");
    if (separatorIdx === -1) return;

    const tenantSchema = external_id.substring(0, separatorIdx);
    const backendMeetingId = parseInt(
      external_id.substring(separatorIdx + 2),
      10,
    );
    if (isNaN(backendMeetingId)) return;

    const db = initTenantModels(tenantSchema);

    let newAiStatus = null;
    switch (event_type) {
      case "transcription.completed":
      case "speakers.identified":
        newAiStatus = "processing";
        break;
      case "tasks.ready_for_review":
        newAiStatus = "pending_review";
        break;
      case "review.completed":
        newAiStatus = "processing"; // resuming post-review stages
        break;
      case "processing.completed":
        newAiStatus = "completed";
        break;
      case "processing.failed":
        newAiStatus = "failed";
        break;
    }

    if (newAiStatus) {
      await db.Meeting.update(
        { ai_status: newAiStatus },
        { where: { id: backendMeetingId } },
      );
      console.log(
        `🔔 AI webhook: meeting ${backendMeetingId} → ai_status=${newAiStatus} (event: ${event_type})`,
      );
    }
  } catch (err) {
    console.error("AI webhook error:", err.message);
  }
};
