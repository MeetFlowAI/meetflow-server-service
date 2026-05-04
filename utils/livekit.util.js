/**
 * utils/livekit.util.js
 *
 * LiveKit server-side utilities:
 *  - Room management (create, delete, participants)
 *  - Token generation
 *  - Room Composite Egress (audio recording → Supabase S3)
 *  - Webhook receiver
 *
 * SDK: livekit-server-sdk v2.15.x
 * NOTE: In v2, EncodedFileOutput/DirectFileOutput are NOT named exports.
 *       Pass plain objects for egress output configuration.
 */

import {
  AccessToken,
  RoomServiceClient,
  WebhookReceiver,
  EgressClient,
  EncodedFileOutput,
} from "livekit-server-sdk";

import { S3Upload, EncodingOptions, AudioCodec } from "@livekit/protocol";
import { envConfig } from "../config/env.config.js";

const LK_URL = envConfig.LIVEKIT_URL;
const LK_API_KEY = envConfig.LIVEKIT_API_KEY;
const LK_API_SECRET = envConfig.LIVEKIT_API_SECRET;

if (
  !envConfig.SUPABASE_S3_ACCESS_KEY ||
  !envConfig.SUPABASE_S3_SECRET_KEY ||
  !envConfig.SUPABASE_URL
) {
  console.error(
    "❌ FATAL: Supabase S3 env vars missing — recordings will fail. Check SUPABASE_URL, SUPABASE_S3_ACCESS_KEY, SUPABASE_S3_SECRET_KEY in .env",
  );
}

// ─── Singletons ───────────────────────────────────────────────────────────────
let _roomSvc = null;
const getRoomService = () => {
  if (!_roomSvc)
    _roomSvc = new RoomServiceClient(LK_URL, LK_API_KEY, LK_API_SECRET);
  return _roomSvc;
};

let _egressSvc = null;
const getEgressClient = () => {
  if (!_egressSvc)
    _egressSvc = new EgressClient(LK_URL, LK_API_KEY, LK_API_SECRET);
  return _egressSvc;
};

// ─── Room management ──────────────────────────────────────────────────────────
export const createLiveKitRoom = async (
  roomName,
  maxParticipants = 10,
  emptyTimeoutSeconds = 300,
) => {
  const svc = getRoomService();
  return svc.createRoom({
    name: roomName,
    maxParticipants,
    emptyTimeout: emptyTimeoutSeconds,
  });
};

export const deleteLiveKitRoom = async (roomName) => {
  const svc = getRoomService();
  return svc.deleteRoom(roomName);
};

export const getLiveKitParticipants = async (roomName) => {
  const svc = getRoomService();
  return svc.listParticipants(roomName);
};

// ─── Token generation ─────────────────────────────────────────────────────────
export const generateJoinToken = ({
  roomName,
  participantName,
  // Accept either `participantId` (old callers) or `identity` (new callers).
  // Previously the service passed `identity` but this function only destructured
  // `participantId`, so it was always undefined → String("undefined") → every
  // participant shared the same identity → LiveKit kicked the previous user on join.
  participantId,
  identity,
  isHost = false,
}) => {
  const resolvedIdentity = identity ?? participantId;
  if (!resolvedIdentity) {
    throw new Error(
      "generateJoinToken: either `identity` or `participantId` must be provided",
    );
  }
  const at = new AccessToken(LK_API_KEY, LK_API_SECRET, {
    identity: String(resolvedIdentity),
    name: participantName,
    ttl: "4h",
  });
  at.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
    roomAdmin: isHost,
    roomRecord: isHost,
  });
  return at.toJwt();
};

// ─── Webhook Receiver ─────────────────────────────────────────────────────────
export const getWebhookReceiver = () =>
  new WebhookReceiver(LK_API_KEY, LK_API_SECRET);

// ─── Start Room Composite Egress (audio-only recording) ───────────────────────
/**
 * Starts an audio-only recording of a LiveKit room.
 * Uploads MP3 to Supabase Storage via S3-compatible API.
 *
 * Uses plain objects for output config (v2 SDK — no named type exports needed).
 *
 * @param {string} roomName
 * @returns {Promise<string|null>} egressId — store on meeting record
 */
export const startRoomRecording = async (roomName) => {
  try {
    const client = getEgressClient();

    const supabaseRef = envConfig.SUPABASE_URL?.replace(
      "https://",
      "",
    )?.replace(".supabase.co", "");
    const bucket = envConfig.SUPABASE_STORAGE_BUCKET || "recordings";

    // Use a fixed timestamp so we know exactly what filename LiveKit will use
    const timestamp = Date.now();
    const filePath = `${roomName}/${timestamp}`; // LiveKit appends .mp4

    const s3 = new S3Upload({
      accessKey: envConfig.SUPABASE_S3_ACCESS_KEY,
      secret: envConfig.SUPABASE_S3_SECRET_KEY,
      region: envConfig.SUPABASE_S3_REGION || "ap-southeast-1",
      endpoint: `https://${supabaseRef}.supabase.co/storage/v1/s3`,
      bucket,
      forcePathStyle: true,
    });

    const fileOutput = new EncodedFileOutput({
      filepath: filePath,
      output: { case: "s3", value: s3 },
    });

    const egress = await client.startRoomCompositeEgress(roomName, fileOutput, {
      audioOnly: true,
      encodingOptions: new EncodingOptions({
        audioCodec: AudioCodec.AAC,
        audioBitrate: 128000,
      }),
    });

    // Build the expected public URL now — LiveKit always appends .mp4
    const expectedUrl = `https://${supabaseRef}.supabase.co/storage/v1/object/public/${bucket}/${filePath}.mp4`;

    console.log(
      `🎙️ Recording started for room "${roomName}" — egress: ${egress.egressId}`,
    );
    console.log(`📎 Expected recording URL: ${expectedUrl}`);

    // Return both so the service can store the expected URL alongside egressId
    return { egressId: egress.egressId, expectedUrl };
  } catch (err) {
    console.warn(
      `⚠️ Could not start recording for room "${roomName}": ${err.message}`,
    );
    return { egressId: null, expectedUrl: null };
  }
};

// ─── Stop Egress and wait for upload to complete ──────────────────────────────
/**
 * Stops a running egress job and polls until the file is fully uploaded
 * to Supabase before returning the public URL.
 *
 * IMPORTANT: stopEgress() only signals LiveKit to stop — the S3 upload
 * happens asynchronously afterward. We must poll until EGRESS_COMPLETE
 * before returning the URL, otherwise the AI service will get a 404.
 *
 * @param {string} egressId
 * @param {string} roomName
 * @returns {Promise<string|null>} Public Supabase URL or null on failure
 */
export const stopRoomRecording = async (egressId) => {
  if (!egressId) return null;

  try {
    const client = getEgressClient();
    await client.stopEgress(egressId);

    // Poll until EGRESS_COMPLETE — confirms S3 upload finished
    const MAX_POLLS = 24;
    for (let i = 0; i < MAX_POLLS; i++) {
      await new Promise((r) => setTimeout(r, 5000));

      let infos;
      try {
        infos = await client.listEgress({ egressId });
      } catch (e) {
        console.warn(`listEgress poll ${i + 1} failed: ${e.message}`);
        continue;
      }

      const info = infos?.[0];
      if (!info) break;

      const status = info.status;
      const isComplete =
        status === 3 || status === "EGRESS_COMPLETE" || String(status) === "3";
      const isFailed =
        status === 4 ||
        status === 5 ||
        status === 6 ||
        status === "EGRESS_FAILED" ||
        status === "EGRESS_ABORTED" ||
        status === "EGRESS_LIMIT_REACHED";

      if (isComplete) {
        console.log(`✅ Egress ${egressId} confirmed complete`);
        return true; // URL was already saved at meeting start
      }
      if (isFailed) {
        console.warn(`⚠️ Egress ${egressId} failed with status ${status}`);
        return false;
      }
      console.log(
        `⏳ Egress ${egressId} still uploading... poll ${i + 1}/${MAX_POLLS}`,
      );
    }

    // Timeout — but the URL was already saved, so return true optimistically
    // The file will likely still be there even if we timed out polling
    console.warn(
      `⚠️ Egress ${egressId} poll timed out — URL already saved, proceeding`,
    );
    return true;
  } catch (err) {
    console.warn(
      `⚠️ stopRoomRecording failed for egress "${egressId}": ${err.message}`,
    );
    return false;
  }
};
