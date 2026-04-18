import * as ChannelMemberService from "../../services/workspace/channelMember.service.js";
import { successResponse, errorResponse } from "../../utils/response.util.js";
import { STATUS_CODES, RESPONSE_MESSAGES } from "../../constants/response.js";

export const getChannelMembers = async (req, res) => {
  try {
    const data = await ChannelMemberService.getChannelMembers({
      tenantSchema: req.user.tenantSchema,
      channelId: req.params.channelId,
      userId: req.user.userId,
      filters: req.query,
    });
    return successResponse(res, STATUS_CODES.OK, RESPONSE_MESSAGES.SUCCESS, "Channel members retrieved successfully", data);
  } catch (err) {
    return errorResponse(res, err.statusCode || STATUS_CODES.BAD_REQUEST, RESPONSE_MESSAGES.ERROR, err.message, err);
  }
};

export const addMemberToChannel = async (req, res) => {
  try {
    const data = await ChannelMemberService.addMemberToChannel({
      tenantSchema: req.user.tenantSchema,
      channelId: req.params.channelId,
      userId: req.body.user_id,
      requestingUserId: req.user.userId,
    });
    return successResponse(res, STATUS_CODES.CREATED, RESPONSE_MESSAGES.SUCCESS, "Member added to channel successfully", data);
  } catch (err) {
    return errorResponse(res, err.statusCode || STATUS_CODES.BAD_REQUEST, RESPONSE_MESSAGES.ERROR, err.message, err);
  }
};

export const removeMemberFromChannel = async (req, res) => {
  try {
    const data = await ChannelMemberService.removeMemberFromChannel({
      tenantSchema: req.user.tenantSchema,
      channelId: req.params.channelId,
      userId: req.params.userId,
      requestingUserId: req.user.userId,
    });
    return successResponse(res, STATUS_CODES.OK, RESPONSE_MESSAGES.SUCCESS, "Member removed from channel successfully", data);
  } catch (err) {
    return errorResponse(res, err.statusCode || STATUS_CODES.BAD_REQUEST, RESPONSE_MESSAGES.ERROR, err.message, err);
  }
};

export const joinChannel = async (req, res) => {
  try {
    const data = await ChannelMemberService.joinChannel({
      tenantSchema: req.user.tenantSchema,
      channelId: req.params.channelId,
      userId: req.user.userId,
    });
    return successResponse(res, STATUS_CODES.OK, RESPONSE_MESSAGES.SUCCESS, "Joined channel successfully", data);
  } catch (err) {
    return errorResponse(res, err.statusCode || STATUS_CODES.BAD_REQUEST, RESPONSE_MESSAGES.ERROR, err.message, err);
  }
};

export const leaveChannel = async (req, res) => {
  try {
    const data = await ChannelMemberService.leaveChannel({
      tenantSchema: req.user.tenantSchema,
      channelId: req.params.channelId,
      userId: req.user.userId,
    });
    return successResponse(res, STATUS_CODES.OK, RESPONSE_MESSAGES.SUCCESS, "Left channel successfully", data);
  } catch (err) {
    return errorResponse(res, err.statusCode || STATUS_CODES.BAD_REQUEST, RESPONSE_MESSAGES.ERROR, err.message, err);
  }
};
