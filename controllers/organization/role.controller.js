import * as RoleService from "../../services/organization/role.service.js";
import { successResponse, errorResponse } from "../../utils/response.util.js";
import { STATUS_CODES, RESPONSE_MESSAGES } from "../../constants/response.js";

// ─── Org Role Controller ──────────────────────────────────────────────────────

export const getAllRoles = async (req, res) => {
  try {
    const result = await RoleService.getAllRoles({
      tenantSchema: req.user.tenantSchema,
      filters: req.query,
    });
    return successResponse(res, STATUS_CODES.OK, RESPONSE_MESSAGES.SUCCESS, "Roles retrieved successfully", result);
  } catch (err) {
    return errorResponse(res, err.statusCode || STATUS_CODES.BAD_REQUEST, RESPONSE_MESSAGES.ERROR, err.message, err);
  }
};

export const getRoleById = async (req, res) => {
  try {
    const result = await RoleService.getRoleById({
      tenantSchema: req.user.tenantSchema,
      roleId: req.params.id,
    });
    return successResponse(res, STATUS_CODES.OK, RESPONSE_MESSAGES.SUCCESS, "Role retrieved successfully", result);
  } catch (err) {
    return errorResponse(res, err.statusCode || STATUS_CODES.BAD_REQUEST, RESPONSE_MESSAGES.ERROR, err.message, err);
  }
};

export const createRole = async (req, res) => {
  try {
    const result = await RoleService.createRole({
      tenantSchema: req.user.tenantSchema,
      data: req.body,
    });
    return successResponse(res, STATUS_CODES.CREATED, RESPONSE_MESSAGES.SUCCESS, "Role created successfully", result);
  } catch (err) {
    return errorResponse(res, err.statusCode || STATUS_CODES.BAD_REQUEST, RESPONSE_MESSAGES.ERROR, err.message, err);
  }
};

export const updateRole = async (req, res) => {
  try {
    const result = await RoleService.updateRole({
      tenantSchema: req.user.tenantSchema,
      roleId: req.params.id,
      data: req.body,
    });
    return successResponse(res, STATUS_CODES.OK, RESPONSE_MESSAGES.SUCCESS, "Role updated successfully", result);
  } catch (err) {
    return errorResponse(res, err.statusCode || STATUS_CODES.BAD_REQUEST, RESPONSE_MESSAGES.ERROR, err.message, err);
  }
};

export const deleteRole = async (req, res) => {
  try {
    const result = await RoleService.deleteRole({
      tenantSchema: req.user.tenantSchema,
      roleId: req.params.id,
    });
    return successResponse(res, STATUS_CODES.OK, RESPONSE_MESSAGES.SUCCESS, "Role deleted successfully", result);
  } catch (err) {
    return errorResponse(res, err.statusCode || STATUS_CODES.BAD_REQUEST, RESPONSE_MESSAGES.ERROR, err.message, err);
  }
};
