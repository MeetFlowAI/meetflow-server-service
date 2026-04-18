/**
 * services/chat/stream.service.js
 *
 * All Stream Chat business logic.
 *
 * Key principle: Stream is our messaging layer. Our Postgres DB still owns
 * users, workspaces, channels, and meetings. Stream just gets a mirror of
 * what it needs to power chat. We call Stream AFTER our DB operations succeed.
 *
 * Endpoints this service powers:
 *
 *  GET  /chat/token                → generate Stream token for logged-in user
 *  POST /chat/channels             → create a Stream channel for a workspace channel
 *  POST /chat/dm                   → create/get a DM channel between two users
 *  POST /chat/meeting-channel      → create an in-meeting chat channel
 *  POST /chat/channels/:id/members → add members
 *  DELETE /chat/channels/:id/members/:userId → remove member
 */

import {
  generateStreamUserToken,
  upsertStreamUser,
  createStreamTeamChannel,
  createStreamDMChannel,
  createStreamMeetingChannel,
  addMembersToStreamChannel,
  removeMemberFromStreamChannel,
  deleteStreamChannel,
  buildChannelStreamId,
  buildDMStreamId,
  getStreamClient,
} from "../../utils/stream.util.js";

import { initTenantModels } from "../../models/index.js";
import * as WorkspaceMemberRepository from "../../repositories/workspace/workspaceMember.repository.js";
import * as ChannelRepository from "../../repositories/workspace/channel.repository.js";

// ─── Get Stream token for the current user ────────────────────────────────────
/**
 * Called once after login / on app load.
 * Frontend uses this token to connect to Stream and receive all channels.
 *
 * We also upsert the user into Stream here so they always have fresh data.
 */
export const getTokenForUser = async ({ tenantSchema, userId }) => {
  try {
    const db = initTenantModels(tenantSchema);
    const user = await db.User.findOne({
      where: { id: userId },
      attributes: ["id", "first_name", "last_name", "email"],
    });

    if (!user)
      throw Object.assign(new Error("User not found."), { statusCode: 404 });

    // Sync latest user data to Stream
    await upsertStreamUser({
      id: user.id,
      name: `${user.first_name} ${user.last_name}`.trim(),
      email: user.email,
    });

    const token = generateStreamUserToken(userId);

    return {
      token,
      stream_api_key: process.env.STREAM_API_KEY,
      user_id: String(userId),
    };
  } catch (err) {
    throw { statusCode: err.statusCode || 500, message: err.message };
  }
};

// ─── Provision a workspace channel in Stream ──────────────────────────────────
/**
 * Called when a workspace channel is created in MeetFlow.
 * Creates the mirror channel in Stream with all current workspace members.
 *
 * The frontend then uses the returned stream_channel_id to open the channel.
 */
export const provisionChannelInStream = async ({
  tenantSchema,
  workspaceId,
  channelId,
  channelName,
  channelDescription,
  creatorId,
  isPrivate,
}) => {
  try {
    const streamChannelId = buildChannelStreamId(workspaceId, channelId);

    // Get all workspace members to add to Stream channel
    const { data: members } =
      await WorkspaceMemberRepository.getWorkspaceMembers(
        tenantSchema,
        workspaceId,
        { skip: 0, limit: 500 }, // get all members
      );

    const memberIds = members
      .map((m) => m.user_id || m.member?.id)
      .filter(Boolean);

    await createStreamTeamChannel({
      streamChannelId,
      name: channelName,
      description: channelDescription,
      creatorId,
      memberIds,
      isPrivate,
    });

    return { stream_channel_id: streamChannelId, stream_channel_type: "team" };
  } catch (err) {
    throw { statusCode: err.statusCode || 500, message: err.message };
  }
};

// ─── Get or create a DM channel ───────────────────────────────────────────────
/**
 * Called when User A clicks on User B's name to start a DM.
 * Stream returns the same channel if it already exists.
 * Returns the stream_channel_id so the frontend can open it.
 */
export const getOrCreateDMChannel = async ({
  tenantSchema,
  userIdA,
  userIdB,
}) => {
  try {
    const db = initTenantModels(tenantSchema);

    // Ensure both users exist in Stream
    const users = await db.User.findAll({
      where: { id: [userIdA, userIdB] },
      attributes: ["id", "first_name", "last_name", "email"],
    });

    if (users.length !== 2) {
      throw Object.assign(new Error("One or both users not found."), {
        statusCode: 404,
      });
    }

    await Promise.all(
      users.map((u) =>
        upsertStreamUser({
          id: u.id,
          name: `${u.first_name} ${u.last_name}`.trim(),
          email: u.email,
        }),
      ),
    );

    const channel = await createStreamDMChannel({ userIdA, userIdB });
    const streamChannelId = buildDMStreamId(userIdA, userIdB);

    return {
      stream_channel_id: streamChannelId,
      stream_channel_type: "messaging",
      // The frontend can use this to open the DM channel directly
    };
  } catch (err) {
    throw { statusCode: err.statusCode || 500, message: err.message };
  }
};

// ─── Create an in-meeting chat channel ───────────────────────────────────────
/**
 * Called from meeting.service.js when a meeting starts.
 * All meeting participants are added to this channel.
 * Returns stream_channel_id — stored in the meeting record.
 */
export const createMeetingChatChannel = async ({
  livekitRoomName,
  title,
  hostId,
  participantIds = [],
}) => {
  try {
    // Ensure host is in Stream
    const allIds = [...new Set([hostId, ...participantIds])];
    const { stream_channel_id } = await createStreamMeetingChannel({
      livekitRoomName,
      title,
      hostId,
      memberIds: allIds,
    });

    return {
      stream_channel_id,
      stream_channel_type: "team",
    };
  } catch (err) {
    throw { statusCode: err.statusCode || 500, message: err.message };
  }
};

// ─── Add a member to a Stream channel ────────────────────────────────────────
export const addMemberToChannel = async ({
  streamChannelId,
  streamChannelType = "team",
  userId,
}) => {
  try {
    await addMembersToStreamChannel(streamChannelId, streamChannelType, [
      userId,
    ]);
    return { success: true };
  } catch (err) {
    throw { statusCode: err.statusCode || 500, message: err.message };
  }
};

// ─── Remove a member from a Stream channel ───────────────────────────────────
export const removeMemberFromChannel = async ({
  streamChannelId,
  streamChannelType = "team",
  userId,
}) => {
  try {
    await removeMemberFromStreamChannel(
      streamChannelId,
      streamChannelType,
      userId,
    );
    return { success: true };
  } catch (err) {
    throw { statusCode: err.statusCode || 500, message: err.message };
  }
};

// ─── Delete a Stream channel ──────────────────────────────────────────────────
export const removeChannel = async ({
  streamChannelId,
  streamChannelType = "team",
}) => {
  try {
    await deleteStreamChannel(streamChannelId, streamChannelType);
    return { success: true };
  } catch (err) {
    throw { statusCode: err.statusCode || 500, message: err.message };
  }
};

// ─── Bulk provision all channels for a workspace ─────────────────────────────
/**
 * Called when a user first logs in or workspace is opened.
 * Ensures all existing workspace channels exist in Stream.
 * Idempotent — safe to call multiple times.
 */
export const syncWorkspaceChannelsToStream = async ({
  tenantSchema,
  workspaceId,
  currentUserId,
}) => {
  try {
    const channels = await ChannelRepository.getChannelsByWorkspace(
      tenantSchema,
      workspaceId,
      { skip: 0, limit: 200 },
    );

    const { data: members } =
      await WorkspaceMemberRepository.getWorkspaceMembers(
        tenantSchema,
        workspaceId,
        { skip: 0, limit: 500 },
      );

    const memberIds = members.map((m) => m.user_id).filter(Boolean);

    const results = [];
    for (const ch of channels.data || []) {
      try {
        const streamChannelId = buildChannelStreamId(workspaceId, ch.id);
        await createStreamTeamChannel({
          streamChannelId,
          name: ch.name,
          description: ch.description || "",
          creatorId: currentUserId,
          memberIds,
          isPrivate: ch.type === "private",
        });
        results.push({
          channel_id: ch.id,
          stream_channel_id: streamChannelId,
          status: "ok",
        });
      } catch {
        results.push({ channel_id: ch.id, status: "skipped" });
      }
    }

    return results;
  } catch (err) {
    throw { statusCode: err.statusCode || 500, message: err.message };
  }
};
