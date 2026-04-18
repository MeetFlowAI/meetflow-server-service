import * as WorkspaceMemberService from "../../services/workspace/workspaceMember.service.js";
import { successResponse, errorResponse } from "../../utils/response.util.js";
import { STATUS_CODES, RESPONSE_MESSAGES } from "../../constants/response.js";

export const getWorkspaceMembers = async (req, res) => {
  try {
    console.log("workspaceId:", req.params.workspaceId);
    const data = await WorkspaceMemberService.getWorkspaceMembers({
      tenantSchema: req.user.tenantSchema,
      workspaceId: req.params.workspaceId,
      filters: req.query,
    });
    return successResponse(
      res,
      STATUS_CODES.OK,
      RESPONSE_MESSAGES.SUCCESS,
      "Members retrieved successfully",
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

export const addMember = async (req, res) => {
  try {
    const data = await WorkspaceMemberService.addMember({
      tenantSchema: req.user.tenantSchema,
      workspaceId: req.params.workspaceId,
      data: req.body,
      requestingUserRole: req.user.role,
    });
    return successResponse(
      res,
      STATUS_CODES.CREATED,
      RESPONSE_MESSAGES.SUCCESS,
      "Member added to workspace successfully",
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

export const updateMemberRole = async (req, res) => {
  try {
    const data = await WorkspaceMemberService.updateMemberRole({
      tenantSchema: req.user.tenantSchema,
      workspaceId: req.params.workspaceId,
      userId: req.params.userId,
      role: req.body.role,
      requestingUserId: req.user.userId,
    });
    return successResponse(
      res,
      STATUS_CODES.OK,
      RESPONSE_MESSAGES.SUCCESS,
      "Member role updated successfully",
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

export const removeMember = async (req, res) => {
  try {
    const data = await WorkspaceMemberService.removeMember({
      tenantSchema: req.user.tenantSchema,
      workspaceId: req.params.workspaceId,
      userId: req.params.userId,
      requestingUserId: req.user.userId,
      requestingUserRole: req.user.role,
    });
    return successResponse(
      res,
      STATUS_CODES.OK,
      RESPONSE_MESSAGES.SUCCESS,
      "Member removed from workspace successfully",
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
