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
  EgressClient,
  EncodedFileOutput,
  EncodedFileType,
  DirectFileOutput,
  SegmentedFileOutput,
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

// ─── Lazy singleton for the egress client ─────────────────────────────────────
let _egressSvc = null;
const getEgressClient = () => {
  if (!_egressSvc) {
    _egressSvc = new EgressClient(LK_URL, LK_API_KEY, LK_API_SECRET);
  }
  return _egressSvc;
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

// ─── Start Room Composite Egress (recording) ──────────────────────────────────
/**
 * Starts recording a LiveKit room to Supabase Storage via S3-compatible API.
 *
 * Supabase Storage exposes an S3-compatible endpoint:
 *   https://<project-ref>.supabase.co/storage/v1/s3
 *
 * LiveKit Egress uploads the finished MP3 file directly to Supabase.
 * The file path inside the bucket is: recordings/{roomName}/{timestamp}.mp3
 *
 * @param {string} roomName - LiveKit room name (e.g. "mf-uuid")
 * @returns {Promise<string>} egressId - store on meeting record to stop it later
 */
export const startRoomRecording = async (roomName) => {
  try {
    const client = getEgressClient();

    const supabaseRef = envConfig.SUPABASE_URL?.replace(
      "https://",
      "",
    )?.replace(".supabase.co", "");

    const bucket = envConfig.SUPABASE_STORAGE_BUCKET || "recordings";
    const filePath = `${roomName}/${Date.now()}.mp3`;

    const fileOutput = new EncodedFileOutput({
      filepath: filePath,
      output: {
        s3: {
          accessKey: envConfig.SUPABASE_S3_ACCESS_KEY,
          secret: envConfig.SUPABASE_S3_SECRET_KEY,
          region: envConfig.SUPABASE_S3_REGION || "ap-south-1",
          endpoint: `https://${supabaseRef}.supabase.co/storage/v1/s3`,
          bucket,
          forcePathStyle: true,
        },
      },
    });

    const egress = await client.startRoomCompositeEgress(roomName, {
      file: fileOutput,
      audioOnly: true,
      encodingOptions: {
        audioCodec: "AAC",
        audioBitrate: 128,
      },
    });

    console.log(
      `🎙️ Recording started for room "${roomName}" — egress: ${egress.egressId}`,
    );

    return egress.egressId;
  } catch (err) {
    console.warn(
      `⚠️ Could not start recording for room "${roomName}": ${err.message}`,
    );
    return null;
  }
};

// ─── Stop Egress and get recording URL ────────────────────────────────────────
/**
 * Stops a running egress job and returns the public Supabase URL of the recording.
 *
 * @param {string} egressId  - From startRoomRecording()
 * @param {string} roomName  - Used to construct the Supabase public URL
 * @returns {Promise<string|null>} Public URL of the recording file, or null on failure
 */
export const stopRoomRecording = async (egressId, roomName) => {
  if (!egressId) return null;

  try {
    const client = getEgressClient();

    // Stop the egress — LiveKit finalises the file and uploads to Supabase
    const result = await client.stopEgress(egressId);

    // Build the public Supabase Storage URL
    // Format: https://<ref>.supabase.co/storage/v1/object/public/<bucket>/<filepath>
    const supabaseRef = envConfig.SUPABASE_URL?.replace(
      "https://",
      "",
    )?.replace(".supabase.co", "");

    const bucket = envConfig.SUPABASE_STORAGE_BUCKET || "recordings";

    // result.fileResults contains the uploaded file path
    const filePath =
      result?.fileResults?.[0]?.filename || `${roomName}/${Date.now()}.mp3`;

    // Strip bucket prefix from path if LiveKit includes it
    const cleanPath = filePath.replace(new RegExp(`^${bucket}/`), "");

    const publicUrl = `https://${supabaseRef}.supabase.co/storage/v1/object/public/${bucket}/${cleanPath}`;

    console.log(`✅  Recording saved: ${publicUrl}`);
    return publicUrl;
  } catch (err) {
    console.warn(`⚠️  Could not stop egress "${egressId}": ${err.message}`);
    return null;
  }
};
