import * as UserService from "../../services/organization/user.service.js";
import { successResponse, errorResponse } from "../../utils/response.util.js";
import { STATUS_CODES, RESPONSE_MESSAGES } from "../../constants/response.js";

// ─── User Controller ────────────────────────────────────────────────────────

export const getAllUsers = async (req, res) => {
  try {
    const result = await UserService.getAllUsers({
      tenantSchema: req.user.tenantSchema,
      filters: req.query,
    });
    return successResponse(
      res,
      STATUS_CODES.OK,
      RESPONSE_MESSAGES.SUCCESS,
      "Users retrieved successfully",
      result,
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

export const getUserById = async (req, res) => {
  try {
    const result = await UserService.getUserById({
      tenantSchema: req.user.tenantSchema,
      userId: req.params.id,
    });
    return successResponse(
      res,
      STATUS_CODES.OK,
      RESPONSE_MESSAGES.SUCCESS,
      "User retrieved successfully",
      result,
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

export const updateUserRole = async (req, res) => {
  try {
    const result = await UserService.updateUserRole({
      tenantSchema: req.user.tenantSchema,
      userId: req.params.id,
      roleId: req.body.role_id,
      requestingUserId: req.user.userId,
    });
    return successResponse(
      res,
      STATUS_CODES.OK,
      RESPONSE_MESSAGES.SUCCESS,
      "User role updated successfully",
      result,
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

export const deactivateUser = async (req, res) => {
  try {
    const result = await UserService.deactivateUser({
      tenantSchema: req.user.tenantSchema,
      userId: req.params.id,
      requestingUserId: req.user.userId,
    });
    return successResponse(
      res,
      STATUS_CODES.OK,
      RESPONSE_MESSAGES.SUCCESS,
      "User deactivated successfully",
      result,
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

export const activateUser = async (req, res) => {
  try {
    const result = await UserService.activateUser({
      tenantSchema: req.user.tenantSchema,
      userId: req.params.id,
    });
    return successResponse(
      res,
      STATUS_CODES.OK,
      RESPONSE_MESSAGES.SUCCESS,
      "User activated successfully",
      result,
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

export const removeUser = async (req, res) => {
  try {
    const result = await UserService.removeUser({
      tenantSchema: req.user.tenantSchema,
      userId: req.params.id,
      requestingUserId: req.user.userId,
    });
    return successResponse(
      res,
      STATUS_CODES.OK,
      RESPONSE_MESSAGES.SUCCESS,
      "User removed successfully",
      result,
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
