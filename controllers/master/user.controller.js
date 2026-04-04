import * as UserService from "../../services/master/user.service.js";
import { successResponse, errorResponse } from "../../utils/response.util.js";
import { STATUS_CODES, RESPONSE_MESSAGES } from "../../constants/response.js";

// ─── User CRUD ────────────────────────────────────────────────────────────────

export const getAllUsers = async (req, res) => {
  try {
    const result = await UserService.getAllUsers(req.query);
    return successResponse(
      res,
      STATUS_CODES.OK,
      RESPONSE_MESSAGES.SUCCESS,
      "Users retrieved successfully",
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

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await UserService.getUserById(id);
    return successResponse(
      res,
      STATUS_CODES.OK,
      RESPONSE_MESSAGES.SUCCESS,
      "User retrieved successfully",
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

export const createUser = async (req, res) => {
  try {
    const result = await UserService.createUser(req.body);
    return successResponse(
      res,
      STATUS_CODES.CREATED,
      RESPONSE_MESSAGES.SUCCESS,
      "User created successfully",
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

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await UserService.updateUser(id, req.body);
    return successResponse(
      res,
      STATUS_CODES.OK,
      RESPONSE_MESSAGES.SUCCESS,
      "User updated successfully",
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

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await UserService.deleteUser(id);
    return successResponse(
      res,
      STATUS_CODES.OK,
      RESPONSE_MESSAGES.SUCCESS,
      "User deleted successfully",
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

// ─── Bulk Controllers ─────────────────────────────────────────────────────────

export const bulkCreateUsers = async (req, res) => {
  try {
    const result = await UserService.bulkCreateUsers(req.body.items);
    return successResponse(
      res,
      STATUS_CODES.OK,
      RESPONSE_MESSAGES.SUCCESS,
      "Bulk create users completed",
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

export const bulkUpdateUsers = async (req, res) => {
  try {
    const result = await UserService.bulkUpdateUsers(req.body.items);
    return successResponse(
      res,
      STATUS_CODES.OK,
      RESPONSE_MESSAGES.SUCCESS,
      "Bulk update users completed",
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

export const bulkDeleteUsers = async (req, res) => {
  try {
    const result = await UserService.bulkDeleteUsers(req.body.ids);
    return successResponse(
      res,
      STATUS_CODES.OK,
      RESPONSE_MESSAGES.SUCCESS,
      "Bulk delete users completed",
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
