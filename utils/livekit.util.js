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
  participantId,
  isHost = false,
}) => {
  const at = new AccessToken(LK_API_KEY, LK_API_SECRET, {
    identity: String(participantId),
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
    const filePath = `${roomName}/${Date.now()}.mp3`;

    // S3Upload must be a class instance — plain objects won't serialize correctly
    const s3 = new S3Upload({
      accessKey: envConfig.SUPABASE_S3_ACCESS_KEY,
      secret: envConfig.SUPABASE_S3_SECRET_KEY,
      region: envConfig.SUPABASE_S3_REGION || "ap-southeast-1",
      endpoint: `https://${supabaseRef}.supabase.co/storage/v1/s3`,
      bucket,
      forcePathStyle: true,
    });

    // The S3 config goes inside output as a protobuf oneof: { case: 's3', value: s3 }
    const fileOutput = new EncodedFileOutput({
      filepath: filePath,
      output: { case: "s3", value: s3 },
    });

    const egress = await client.startRoomCompositeEgress(
      roomName,
      fileOutput, // pass EncodedFileOutput directly as the output arg
      {
        audioOnly: true,
        encodingOptions: new EncodingOptions({
          audioCodec: AudioCodec.AAC, // enum value 2, not the string "AAC"
          audioBitrate: 128000, // bits/sec — NOT 128
        }),
      },
    );

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
export const stopRoomRecording = async (egressId, roomName) => {
  if (!egressId) return null;

  try {
    const client = getEgressClient();

    // Signal LiveKit to stop recording
    await client.stopEgress(egressId);

    // Poll until upload completes — max 2 minutes (24 x 5s)
    const MAX_POLLS = 24;
    for (let i = 0; i < MAX_POLLS; i++) {
      await new Promise((r) => setTimeout(r, 5000));

      let infos;
      try {
        infos = await client.listEgress({ egressId });
      } catch (listErr) {
        console.warn(`listEgress poll ${i + 1} failed: ${listErr.message}`);
        continue;
      }

      const info = infos?.[0];
      if (!info) break;

      const status = info.status;
      // EGRESS_COMPLETE = 3 in livekit-server-sdk v2 proto enum
      // Accept both numeric and string forms for safety
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
        const filePath =
          info.fileResults?.[0]?.filename || `${roomName}/${Date.now()}.mp3`;

        const supabaseRef = envConfig.SUPABASE_URL?.replace(
          "https://",
          "",
        )?.replace(".supabase.co", "");
        const bucket = envConfig.SUPABASE_STORAGE_BUCKET || "recordings";
        const cleanPath = filePath.replace(new RegExp(`^${bucket}/`), "");

        const publicUrl = `https://${supabaseRef}.supabase.co/storage/v1/object/public/${bucket}/${cleanPath}`;
        console.log(`✅  Recording saved: ${publicUrl}`);
        return publicUrl;
      }

      if (isFailed) {
        console.warn(`⚠️  Egress ${egressId} failed with status ${status}`);
        break;
      }

      console.log(
        `⏳  Egress ${egressId} still uploading... poll ${i + 1}/${MAX_POLLS}`,
      );
    }

    console.warn(`⚠️  Egress ${egressId} did not complete within timeout`);
    return null;
  } catch (err) {
    console.warn(
      `⚠️  stopRoomRecording failed for egress "${egressId}": ${err.message}`,
    );
    return null;
  }
};
