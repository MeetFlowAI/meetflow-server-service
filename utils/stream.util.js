/**
 * utils/stream.util.js
 *
 * Thin wrapper around the Stream Chat server SDK.
 * Everything Stream-related goes through here — nothing else imports
 * from 'stream-chat' directly.
 *
 * Stream Chat concepts you need to know:
 *
 *  USER    — every person in your app must be upserted into Stream before
 *            they can chat. We do this once when they log in / join an org.
 *            Stream user id = our DB user id (as a string).
 *
 *  CHANNEL — a chat room. Three types we use:
 *    "team"      → workspace channel (public/private, many members) = Slack channel
 *    "messaging" → 1-to-1 DM or small group DM
 *    "meeting"   → in-meeting chat (tied to a LiveKit room)
 *
 *  TOKEN   — the frontend needs a JWT from us to connect to Stream.
 *            We generate it server-side using the user's id.
 *            One token per user, valid forever (or set expiry).
 */

import { StreamChat } from "stream-chat";
import { envConfig } from "../config/env.config.js";

// ─── Singleton client ─────────────────────────────────────────────────────────
let _client = null;

export const getStreamClient = () => {
  if (!_client) {
    _client = StreamChat.getInstance(
      envConfig.STREAM_API_KEY,
      envConfig.STREAM_API_SECRET,
    );
  }
  return _client;
};

// ─── Generate a user token ────────────────────────────────────────────────────
/**
 * The frontend passes this token to StreamChat.connectUser().
 * Must be generated server-side — never in the browser (that would expose your secret).
 *
 * @param {string|number} userId  - our DB user id
 * @returns {string}              - signed JWT
 */
export const generateStreamUserToken = (userId) => {
  const client = getStreamClient();
  return client.createToken(String(userId));
};

// ─── Upsert a user into Stream ────────────────────────────────────────────────
/**
 * Call this when:
 *  - A user logs in for the first time
 *  - A user updates their name/profile
 *  - An invited user accepts their invitation
 *
 * Stream stores a copy of the user's name and image for display in chat.
 * You control the data — Stream just caches it.
 *
 * @param {{ id, name, email, image? }} user
 */
export const upsertStreamUser = async ({ id, name, email, image }) => {
  const client = getStreamClient();
  await client.upsertUser({
    id: String(id),
    name: name || email,
    email: email,
    image: image || null,
  });
};

// ─── Upsert multiple users at once ────────────────────────────────────────────
export const upsertStreamUsers = async (users) => {
  const client = getStreamClient();
  const streamUsers = users.map((u) => ({
    id: String(u.id),
    name: u.name || u.email,
    email: u.email,
    image: u.image || null,
  }));
  await client.upsertUsers(streamUsers);
};

// ─── Create or get a TEAM channel (workspace channel) ─────────────────────────
/**
 * Called when a workspace channel is created in MeetFlow.
 * We mirror it in Stream so messaging works immediately.
 *
 * channelId format we use: `workspace-{workspaceId}-channel-{channelId}`
 * This keeps it unique across all orgs.
 *
 * @param {{ streamChannelId, name, description, creatorId, memberIds, isPrivate }}
 * @returns Stream channel object
 */
export const createStreamTeamChannel = async ({
  streamChannelId,
  name,
  description,
  creatorId,
  memberIds = [],
  isPrivate = false,
}) => {
  const client = getStreamClient();

  const channel = client.channel("team", streamChannelId, {
    name,
    description: description || "",
    created_by_id: String(creatorId),
    members: memberIds.map(String),
    private: isPrivate,
  });

  await channel.create();
  return channel;
};

// ─── Create or get a MESSAGING channel (1-to-1 DM) ───────────────────────────
/**
 * For DMs between two users.
 * Stream auto-generates the channel id for messaging channels from the member list.
 *
 * @param {{ userIdA, userIdB }}
 * @returns Stream channel object
 */
export const createStreamDMChannel = async ({ userIdA, userIdB }) => {
  const client = getStreamClient();

  const channel = client.channel("messaging", {
    members: [String(userIdA), String(userIdB)],
  });

  await channel.create();
  return channel;
};

// ─── Create a MEETING channel (in-meeting chat) ───────────────────────────────
/**
 * Created when a LiveKit meeting starts.
 * Deleted (or archived) when the meeting ends.
 * Channel id = `meeting-{livekitRoomName}`
 *
 * @param {{ livekitRoomName, title, hostId, memberIds }}
 * @returns Stream channel object
 */
export const createStreamMeetingChannel = async ({
  livekitRoomName,
  title,
  hostId,
  memberIds = [],
}) => {
  const client = getStreamClient();

  const channelId = `meeting-${livekitRoomName}`;
  const channel = client.channel("team", channelId, {
    name: title || "Meeting Chat",
    created_by_id: String(hostId),
    members: memberIds.map(String),
    meeting: true, // custom field so frontend can style it differently
  });

  await channel.create();
  return { channel, streamChannelId: channelId };
};

// ─── Add members to a channel ─────────────────────────────────────────────────
export const addMembersToStreamChannel = async (
  streamChannelId,
  channelType = "team",
  userIds = [],
) => {
  const client = getStreamClient();
  const channel = client.channel(channelType, streamChannelId);
  await channel.addMembers(userIds.map(String));
};

// ─── Remove a member from a channel ──────────────────────────────────────────
export const removeMemberFromStreamChannel = async (
  streamChannelId,
  channelType = "team",
  userId,
) => {
  const client = getStreamClient();
  const channel = client.channel(channelType, streamChannelId);
  await channel.removeMembers([String(userId)]);
};

// ─── Delete a channel ─────────────────────────────────────────────────────────
export const deleteStreamChannel = async (
  streamChannelId,
  channelType = "team",
) => {
  try {
    const client = getStreamClient();
    const channel = client.channel(channelType, streamChannelId);
    await channel.delete();
  } catch (err) {
    console.warn(
      `⚠️ Could not delete Stream channel ${streamChannelId}:`,
      err.message,
    );
  }
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build the Stream channel id for a workspace channel.
 * Must be unique, lowercase, no spaces, max 64 chars.
 * Format: ws{workspaceId}ch{channelId}
 */
export const buildChannelStreamId = (workspaceId, channelId) =>
  `ws${workspaceId}ch${channelId}`;

/**
 * Build a deterministic DM channel id for two users.
 * We sort ids so user1+user2 == user2+user1.
 */
export const buildDMStreamId = (userIdA, userIdB) => {
  const sorted = [String(userIdA), String(userIdB)].sort();
  return `dm-${sorted[0]}-${sorted[1]}`;
};
