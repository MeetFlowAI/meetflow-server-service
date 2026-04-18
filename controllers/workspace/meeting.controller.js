/**
 * controllers/workspace/meeting.controller.js
 *
 * Thin layer: parse request → call service → send response.
 * Zero business logic here.
 */

import * as MeetingService from "../../services/workspace/meeting.service.js";
import { successResponse, errorResponse } from "../../utils/response.util.js";
import { STATUS_CODES, RESPONSE_MESSAGES } from "../../constants/response.js";

// POST /workspace/:workspaceId/channels/:channelId/meetings/start
export const startMeeting = async (req, res) => {
  try {
    const data = await MeetingService.startMeeting({
      tenantSchema: req.user.tenantSchema,
      workspaceId: req.params.workspaceId,
      channelId: req.params.channelId,
      userId: req.user.userId,
      title: req.body.title,
    });
    return successResponse(
      res,
      STATUS_CODES.CREATED,
      RESPONSE_MESSAGES.SUCCESS,
      "Meeting started successfully",
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

// POST /workspace/:workspaceId/channels/:channelId/meetings/:meetingId/join
export const joinMeeting = async (req, res) => {
  try {
    const data = await MeetingService.joinMeeting({
      tenantSchema: req.user.tenantSchema,
      workspaceId: req.params.workspaceId,
      channelId: req.params.channelId,
      meetingId: req.params.meetingId,
      userId: req.user.userId,
    });
    return successResponse(
      res,
      STATUS_CODES.OK,
      RESPONSE_MESSAGES.SUCCESS,
      "Joined meeting successfully",
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

// POST /workspace/:workspaceId/channels/:channelId/meetings/:meetingId/end
export const endMeeting = async (req, res) => {
  try {
    const data = await MeetingService.endMeeting({
      tenantSchema: req.user.tenantSchema,
      workspaceId: req.params.workspaceId,
      channelId: req.params.channelId,
      meetingId: req.params.meetingId,
      userId: req.user.userId,
      userOrgRole: req.user.role,
    });
    return successResponse(
      res,
      STATUS_CODES.OK,
      RESPONSE_MESSAGES.SUCCESS,
      "Meeting ended successfully",
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

// GET /workspace/:workspaceId/channels/:channelId/meetings
export const getMeetings = async (req, res) => {
  try {
    const { skip = 0, limit = 20 } = req.query;
    const data = await MeetingService.getMeetings({
      tenantSchema: req.user.tenantSchema,
      workspaceId: req.params.workspaceId,
      channelId: req.params.channelId,
      userId: req.user.userId,
      skip: parseInt(skip),
      limit: parseInt(limit),
    });
    return successResponse(
      res,
      STATUS_CODES.OK,
      RESPONSE_MESSAGES.SUCCESS,
      "Meetings retrieved successfully",
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

// GET /workspace/:workspaceId/channels/:channelId/meetings/:meetingId
export const getMeetingDetail = async (req, res) => {
  try {
    const data = await MeetingService.getMeetingDetail({
      tenantSchema: req.user.tenantSchema,
      workspaceId: req.params.workspaceId,
      channelId: req.params.channelId,
      meetingId: req.params.meetingId,
      userId: req.user.userId,
    });
    return successResponse(
      res,
      STATUS_CODES.OK,
      RESPONSE_MESSAGES.SUCCESS,
      "Meeting retrieved successfully",
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
