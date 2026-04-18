/**
 * controllers/webhook/livekit.controller.js
 *
 * Receives webhook events from LiveKit Cloud.
 *
 * Security: LiveKit signs every webhook with HMAC-SHA256 using your API secret.
 * We verify the signature here before processing anything.
 *
 * To register this webhook in your LiveKit dashboard:
 *   1. Go to cloud.livekit.io → your project → Settings → Webhooks
 *   2. Add URL: https://your-domain.com/api/v1/webhook/livekit
 *   3. Select events: room_finished, participant_joined, participant_left
 *
 * LiveKit webhook docs: https://docs.livekit.io/realtime/server/webhooks/
 */

import { getWebhookReceiver } from "../../utils/livekit.util.js";
import { handleLiveKitWebhook } from "../../services/workspace/meeting.service.js";

export const livekitWebhookHandler = async (req, res) => {
  try {
    // LiveKit sends the Authorization header with the token for verification
    const authHeader = req.headers["authorization"];
    const rawBody = req.rawBody; // set by our raw body middleware in the route

    if (!rawBody) {
      console.warn("LiveKit webhook: no raw body captured");
      return res.status(400).json({ error: "No body" });
    }

    // Verify the webhook signature
    let event;
    try {
      const receiver = getWebhookReceiver();
      event = await receiver.receive(rawBody, authHeader);
    } catch (verifyErr) {
      console.warn(
        "LiveKit webhook signature verification failed:",
        verifyErr.message,
      );
      // Return 200 anyway — don't let LiveKit keep retrying bad requests
      return res.status(200).json({ ok: false, reason: "signature_invalid" });
    }

    console.log(
      `📡 LiveKit webhook received: ${event.event} | room: ${event.room?.name}`,
    );

    // Hand off to service layer (never throws — always returns 200)
    await handleLiveKitWebhook(event);

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("LiveKit webhook controller error:", err.message);
    // Always 200 — LiveKit will stop retrying
    return res.status(200).json({ ok: false, reason: "internal_error" });
  }
};
