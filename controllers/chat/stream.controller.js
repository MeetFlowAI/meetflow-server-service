/**
 * controllers/chat/stream.controller.js
 * Thin HTTP layer — parse request, call service, send response.
 */

import * as StreamService from "../../services/chat/stream.service.js";
import { successResponse, errorResponse } from "../../utils/response.util.js";
import { STATUS_CODES, RESPONSE_MESSAGES } from "../../constants/response.js";

// GET /chat/token
// Called on app load after login — frontend needs this to connect to Stream
export const getChatToken = async (req, res) => {
  try {
    const data = await StreamService.getTokenForUser({
      tenantSchema: req.user.tenantSchema,
      userId: req.user.userId,
    });
    return successResponse(
      res,
      STATUS_CODES.OK,
      RESPONSE_MESSAGES.SUCCESS,
      "Chat token generated",
      data,
    );
  } catch (err) {
    return errorResponse(
      res,
      err.statusCode || STATUS_CODES.BAD_REQUEST,
      RESPONSE_MESSAGES.ERROR,
      err.message,
      err,
    );
  }
};

// POST /chat/channels
// Body: { workspace_id, channel_id, channel_name, channel_description, is_private }
// Called right after a workspace channel is created in your DB
export const provisionChannel = async (req, res) => {
  try {
    const {
      workspace_id,
      channel_id,
      channel_name,
      channel_description,
      is_private,
    } = req.body;
    const data = await StreamService.provisionChannelInStream({
      tenantSchema: req.user.tenantSchema,
      workspaceId: workspace_id,
      channelId: channel_id,
      channelName: channel_name,
      channelDescription: channel_description,
      creatorId: req.user.userId,
      isPrivate: is_private || false,
    });
    return successResponse(
      res,
      STATUS_CODES.CREATED,
      RESPONSE_MESSAGES.SUCCESS,
      "Channel provisioned in Stream",
      data,
    );
  } catch (err) {
    return errorResponse(
      res,
      err.statusCode || STATUS_CODES.BAD_REQUEST,
      RESPONSE_MESSAGES.ERROR,
      err.message,
      err,
    );
  }
};

// POST /chat/dm
// Body: { target_user_id }
// Called when user clicks on another user to open a DM
export const createDM = async (req, res) => {
  try {
    const data = await StreamService.getOrCreateDMChannel({
      tenantSchema: req.user.tenantSchema,
      userIdA: req.user.userId,
      userIdB: req.body.target_user_id,
    });
    return successResponse(
      res,
      STATUS_CODES.OK,
      RESPONSE_MESSAGES.SUCCESS,
      "DM channel ready",
      data,
    );
  } catch (err) {
    return errorResponse(
      res,
      err.statusCode || STATUS_CODES.BAD_REQUEST,
      RESPONSE_MESSAGES.ERROR,
      err.message,
      err,
    );
  }
};

// POST /chat/meeting-channel
// Body: { livekit_room_name, title, participant_ids }
// Called from meeting start flow
export const createMeetingChannel = async (req, res) => {
  try {
    const { livekit_room_name, title, participant_ids } = req.body;
    const data = await StreamService.createMeetingChatChannel({
      livekitRoomName: livekit_room_name,
      title,
      hostId: req.user.userId,
      participantIds: participant_ids || [],
    });
    return successResponse(
      res,
      STATUS_CODES.CREATED,
      RESPONSE_MESSAGES.SUCCESS,
      "Meeting chat channel created",
      data,
    );
  } catch (err) {
    return errorResponse(
      res,
      err.statusCode || STATUS_CODES.BAD_REQUEST,
      RESPONSE_MESSAGES.ERROR,
      err.message,
      err,
    );
  }
};

// POST /chat/channels/:streamChannelId/members
// Body: { user_id, channel_type }
export const addMember = async (req, res) => {
  try {
    const data = await StreamService.addMemberToChannel({
      streamChannelId: req.params.streamChannelId,
      streamChannelType: req.body.channel_type || "team",
      userId: req.body.user_id,
    });
    return successResponse(
      res,
      STATUS_CODES.OK,
      RESPONSE_MESSAGES.SUCCESS,
      "Member added to channel",
      data,
    );
  } catch (err) {
    return errorResponse(
      res,
      err.statusCode || STATUS_CODES.BAD_REQUEST,
      RESPONSE_MESSAGES.ERROR,
      err.message,
      err,
    );
  }
};

// DELETE /chat/channels/:streamChannelId/members/:userId
export const removeMember = async (req, res) => {
  try {
    const data = await StreamService.removeMemberFromChannel({
      streamChannelId: req.params.streamChannelId,
      streamChannelType: req.query.channel_type || "team",
      userId: req.params.userId,
    });
    return successResponse(
      res,
      STATUS_CODES.OK,
      RESPONSE_MESSAGES.SUCCESS,
      "Member removed from channel",
      data,
    );
  } catch (err) {
    return errorResponse(
      res,
      err.statusCode || STATUS_CODES.BAD_REQUEST,
      RESPONSE_MESSAGES.ERROR,
      err.message,
      err,
    );
  }
};

// POST /chat/sync-workspace
// Body: { workspace_id }
// Syncs all existing workspace channels to Stream — call this on workspace open
export const syncWorkspace = async (req, res) => {
  try {
    const data = await StreamService.syncWorkspaceChannelsToStream({
      tenantSchema: req.user.tenantSchema,
      workspaceId: req.body.workspace_id,
      currentUserId: req.user.userId,
    });
    return successResponse(
      res,
      STATUS_CODES.OK,
      RESPONSE_MESSAGES.SUCCESS,
      "Workspace synced to Stream",
      data,
    );
  } catch (err) {
    return errorResponse(
      res,
      err.statusCode || STATUS_CODES.BAD_REQUEST,
      RESPONSE_MESSAGES.ERROR,
      err.message,
      err,
    );
  }
};
