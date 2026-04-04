import * as AuthService from "../../services/common/auth.service.js";
import { successResponse, errorResponse } from "../../utils/response.util.js";
import { STATUS_CODES, RESPONSE_MESSAGES } from "../../constants/response.js";

// ─── Login ────────────────────────────────────────────────────────────────────

export const login = async (req, res) => {
  try {
    const result = await AuthService.login({
      email: req.body.email,
      password: req.body.password,
      rememberMe: req.body.rememberMe || false,
      ip: req.ip || req.connection?.remoteAddress || "Unknown",
      device_info: req.headers["user-agent"] || "Unknown",
    });

    return successResponse(
      res,
      STATUS_CODES.OK,
      RESPONSE_MESSAGES.SUCCESS,
      RESPONSE_MESSAGES.SUCCESS_MESSAGES.LOGIN,
      result,
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

// ─── Logout ───────────────────────────────────────────────────────────────────

export const logout = async (req, res) => {
  try {
    const data = await AuthService.logout({
      refreshToken: req.body.refreshToken,
    });

    return successResponse(
      res,
      STATUS_CODES.OK,
      RESPONSE_MESSAGES.SUCCESS,
      RESPONSE_MESSAGES.SUCCESS_MESSAGES.LOGOUT,
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

// ─── Refresh Token ────────────────────────────────────────────────────────────

export const refreshToken = async (req, res) => {
  try {
    const data = await AuthService.refreshToken({
      refreshToken: req.body.refreshToken,
    });

    return successResponse(
      res,
      STATUS_CODES.OK,
      RESPONSE_MESSAGES.SUCCESS,
      RESPONSE_MESSAGES.SUCCESS_MESSAGES.TOKEN_REFRESH,
      data,
    );
  } catch (err) {
    const statusCode = err.statusCode || STATUS_CODES.UNAUTHORIZED;
    return errorResponse(
      res,
      statusCode,
      RESPONSE_MESSAGES.ERROR,
      err.message,
      err,
    );
  }
};

// ─── Forgot Password ──────────────────────────────────────────────────────────

export const forgotPassword = async (req, res) => {
  try {
    // Always returns success — service never reveals if email exists
    const data = await AuthService.forgotPassword({
      email: req.body.email,
    });

    return successResponse(
      res,
      STATUS_CODES.OK,
      RESPONSE_MESSAGES.SUCCESS,
      RESPONSE_MESSAGES.SUCCESS_MESSAGES.RESET_LINK_SENT,
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

// ─── Reset Password ───────────────────────────────────────────────────────────

export const resetPassword = async (req, res) => {
  try {
    // token + newPassword from body
    // tenantSchema from body (sent by frontend from ?schema= query param)
    const data = await AuthService.resetPassword({
      token: req.body.token,
      newPassword: req.body.newPassword,
      tenantSchema: req.body.tenantSchema || null,
    });

    return successResponse(
      res,
      STATUS_CODES.OK,
      RESPONSE_MESSAGES.SUCCESS,
      RESPONSE_MESSAGES.SUCCESS_MESSAGES.PASSWORD_RESET,
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
