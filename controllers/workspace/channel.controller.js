import * as ChannelService from "../../services/workspace/channel.service.js";
import { successResponse, errorResponse } from "../../utils/response.util.js";
import { STATUS_CODES, RESPONSE_MESSAGES } from "../../constants/response.js";

export const getChannelsForUser = async (req, res) => {
  try {
    const data = await ChannelService.getChannelsForUser({
      tenantSchema: req.user.tenantSchema,
      workspaceId: req.params.workspaceId,
      userId: req.user.userId,
    });
    return successResponse(res, STATUS_CODES.OK, RESPONSE_MESSAGES.SUCCESS, "Channels retrieved successfully", data);
  } catch (err) {
    return errorResponse(res, err.statusCode || STATUS_CODES.BAD_REQUEST, RESPONSE_MESSAGES.ERROR, err.message, err);
  }
};

export const getChannelById = async (req, res) => {
  try {
    const data = await ChannelService.getChannelById({
      tenantSchema: req.user.tenantSchema,
      channelId: req.params.channelId,
      userId: req.user.userId,
    });
    return successResponse(res, STATUS_CODES.OK, RESPONSE_MESSAGES.SUCCESS, "Channel retrieved successfully", data);
  } catch (err) {
    return errorResponse(res, err.statusCode || STATUS_CODES.BAD_REQUEST, RESPONSE_MESSAGES.ERROR, err.message, err);
  }
};

export const createChannel = async (req, res) => {
  try {
    const data = await ChannelService.createChannel({
      tenantSchema: req.user.tenantSchema,
      workspaceId: req.params.workspaceId,
      data: req.body,
      creatorUserId: req.user.userId,
    });
    return successResponse(res, STATUS_CODES.CREATED, RESPONSE_MESSAGES.SUCCESS, "Channel created successfully", data);
  } catch (err) {
    return errorResponse(res, err.statusCode || STATUS_CODES.BAD_REQUEST, RESPONSE_MESSAGES.ERROR, err.message, err);
  }
};

export const updateChannel = async (req, res) => {
  try {
    const data = await ChannelService.updateChannel({
      tenantSchema: req.user.tenantSchema,
      channelId: req.params.channelId,
      data: req.body,
      userId: req.user.userId,
    });
    return successResponse(res, STATUS_CODES.OK, RESPONSE_MESSAGES.SUCCESS, "Channel updated successfully", data);
  } catch (err) {
    return errorResponse(res, err.statusCode || STATUS_CODES.BAD_REQUEST, RESPONSE_MESSAGES.ERROR, err.message, err);
  }
};

export const deleteChannel = async (req, res) => {
  try {
    const data = await ChannelService.deleteChannel({
      tenantSchema: req.user.tenantSchema,
      channelId: req.params.channelId,
      userId: req.user.userId,
      userOrgRole: req.user.role,
    });
    return successResponse(res, STATUS_CODES.OK, RESPONSE_MESSAGES.SUCCESS, "Channel deleted successfully", data);
  } catch (err) {
    return errorResponse(res, err.statusCode || STATUS_CODES.BAD_REQUEST, RESPONSE_MESSAGES.ERROR, err.message, err);
  }
};
