import * as AccountService from "../../services/common/account.service.js";
import { successResponse, errorResponse } from "../../utils/response.util.js";
import { STATUS_CODES, RESPONSE_MESSAGES } from "../../constants/response.js";

// ─── Get Profile ──────────────────────────────────────────────────────────────

export const getProfile = async (req, res) => {
  try {
    const data = await AccountService.getProfile({
      userId: req.user.userId,
      tenantSchema: req.user.tenantSchema,
    });

    return successResponse(
      res,
      STATUS_CODES.OK,
      RESPONSE_MESSAGES.SUCCESS,
      "Profile retrieved successfully",
      data,
    );
  } catch (err) {
    const statusCode = err.statusCode || STATUS_CODES.BAD_REQUEST;
    return errorResponse(
      res,
      statusCode,
      RESPONSE_MESSAGES.ERROR,
      err.message,
      err,
    );
  }
};

// ─── Update Profile ───────────────────────────────────────────────────────────

export const updateProfile = async (req, res) => {
  try {
    const data = await AccountService.updateProfile({
      userId: req.user.userId,
      tenantSchema: req.user.tenantSchema,
      data: req.body,
    });

    return successResponse(
      res,
      STATUS_CODES.OK,
      RESPONSE_MESSAGES.SUCCESS,
      "Profile updated successfully",
      data,
    );
  } catch (err) {
    const statusCode = err.statusCode || STATUS_CODES.BAD_REQUEST;
    return errorResponse(
      res,
      statusCode,
      RESPONSE_MESSAGES.ERROR,
      err.message,
      err,
    );
  }
};

// ─── Change Password ──────────────────────────────────────────────────────────

export const changePassword = async (req, res) => {
  try {
    const data = await AccountService.changePassword({
      userId: req.user.userId,
      tenantSchema: req.user.tenantSchema,
      currentPassword: req.body.currentPassword,
      newPassword: req.body.newPassword,
    });

    return successResponse(
      res,
      STATUS_CODES.OK,
      RESPONSE_MESSAGES.SUCCESS,
      "Password changed successfully",
      data,
    );
  } catch (err) {
    const statusCode = err.statusCode || STATUS_CODES.BAD_REQUEST;
    return errorResponse(
      res,
      statusCode,
      RESPONSE_MESSAGES.ERROR,
      err.message,
      err,
    );
  }
};
