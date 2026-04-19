/**
 * utils/livekit.util.js
 *
 * All LiveKit SDK interactions live here.
 * Nothing else in the codebase imports from livekit-server-sdk directly.
 *
 * Two main jobs:
 *   1. RoomServiceClient  — server-to-LiveKit API calls (create room, delete room, list participants)
 *   2. AccessToken        — generate JWT tokens that the FRONTEND uses to join a room
 */

import {
  AccessToken,
  RoomServiceClient,
  WebhookReceiver,
} from "livekit-server-sdk";
import { envConfig } from "../config/env.config.js";

const LK_API_KEY = envConfig.LIVEKIT_API_KEY;
const LK_API_SECRET = envConfig.LIVEKIT_API_SECRET;
const LK_URL = envConfig.LIVEKIT_URL; // wss://meetflow-xxx.livekit.cloud

// ─── Lazy singleton for the room service ─────────────────────────────────────
// RoomServiceClient uses HTTP (converts wss→https internally)
let _roomSvc = null;
const getRoomService = () => {
  if (!_roomSvc) {
    _roomSvc = new RoomServiceClient(LK_URL, LK_API_KEY, LK_API_SECRET);
  }
  return _roomSvc;
};

// ─── Create a LiveKit room ────────────────────────────────────────────────────
/**
 * @param {string} roomName       - Unique room identifier (we use a UUID-based slug)
 * @param {number} maxParticipants - From plan limits (default 100)
 * @param {number} emptyTimeout   - Seconds before auto-close when empty (default 300 = 5 min)
 * @returns {Promise<object>}     - LiveKit room object
 */
export const createLiveKitRoom = async (
  roomName,
  maxParticipants = 100,
  emptyTimeout = 300,
) => {
  const svc = getRoomService();
  const room = await svc.createRoom({
    name: roomName,
    maxParticipants: parseInt(maxParticipants, 10),
    emptyTimeout: parseInt(emptyTimeout, 10),
    metadata: JSON.stringify({ createdAt: new Date().toISOString() }),
  });
  return room;
};

// ─── Delete / end a LiveKit room ──────────────────────────────────────────────
/**
 * Kicks all participants and closes the room immediately.
 * Non-fatal — if the room is already gone, we just log a warning.
 */
export const deleteLiveKitRoom = async (roomName) => {
  try {
    const svc = getRoomService();
    await svc.deleteRoom(roomName);
    console.log(`🗑️  LiveKit room deleted: ${roomName}`);
  } catch (err) {
    console.warn(
      `⚠️  Could not delete LiveKit room "${roomName}":`,
      err.message,
    );
  }
};

// ─── Get room info ────────────────────────────────────────────────────────────
/**
 * Returns the room object or null if it doesn't exist / has already ended.
 */
export const getLiveKitRoom = async (roomName) => {
  try {
    const svc = getRoomService();
    const rooms = await svc.listRooms([roomName]);
    return rooms[0] || null;
  } catch {
    return null;
  }
};

// ─── List participants currently in a room ────────────────────────────────────
export const getLiveKitParticipants = async (roomName) => {
  try {
    const svc = getRoomService();
    return await svc.listParticipants(roomName);
  } catch {
    return [];
  }
};

// ─── Generate a participant join token ───────────────────────────────────────
/**
 * This JWT is what the FRONTEND passes to `<LiveKitRoom>` / `@livekit/components-react`.
 * It authorises one user to join one specific room.
 *
 * @param {object} opts
 * @param {string} opts.roomName        - The LiveKit room name
 * @param {string|number} opts.identity - Unique per-user ID (we use userId from DB)
 * @param {string} opts.participantName - Display name shown to other participants
 * @param {boolean} opts.canPublish     - Can send audio/video (false = viewer only)
 * @param {boolean} opts.canSubscribe   - Can receive others' audio/video
 * @param {boolean} opts.canPublishData - Can send data messages (chat, reactions)
 * @param {number} opts.ttlSeconds      - Token lifetime in seconds (default 4 hours)
 * @returns {Promise<string>}           - Signed JWT string
 */
export const generateJoinToken = async ({
  roomName,
  identity,
  participantName,
  canPublish = true,
  canSubscribe = true,
  canPublishData = true,
  ttlSeconds = 14400, // 4 hours
}) => {
  const at = new AccessToken(LK_API_KEY, LK_API_SECRET, {
    identity: String(identity),
    name: participantName,
    ttl: ttlSeconds,
  });

  at.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish,
    canSubscribe,
    canPublishData,
  });

  // toJwt() is async in livekit-server-sdk v2+
  return await at.toJwt();
};

// ─── Webhook Receiver ─────────────────────────────────────────────────────────
// Used in webhook controller to verify HMAC signatures from LiveKit
export const getWebhookReceiver = () =>
  new WebhookReceiver(LK_API_KEY, LK_API_SECRET);
