import * as WorkspaceService from "../../services/workspace/workspace.service.js";
import { successResponse, errorResponse } from "../../utils/response.util.js";
import { STATUS_CODES, RESPONSE_MESSAGES } from "../../constants/response.js";
import { provisionAIWorkspace } from "../../services/ai/ai.service.js";
import * as WorkspaceRepository from "../../repositories/workspace/workspace.repository.js";
import { envConfig } from "../../config/env.config.js";

export const getMyWorkspaces = async (req, res) => {
  try {
    const data = await WorkspaceService.getMyWorkspaces({
      tenantSchema: req.user.tenantSchema,
      userId: req.user.userId,
    });
    return successResponse(res, STATUS_CODES.OK, RESPONSE_MESSAGES.SUCCESS, "Workspaces retrieved successfully", data);
  } catch (err) {
    return errorResponse(res, err.statusCode || STATUS_CODES.BAD_REQUEST, RESPONSE_MESSAGES.ERROR, err.message, err);
  }
};

export const getAllWorkspaces = async (req, res) => {
  try {
    const data = await WorkspaceService.getAllWorkspaces({
      tenantSchema: req.user.tenantSchema,
      filters: req.query,
    });
    return successResponse(res, STATUS_CODES.OK, RESPONSE_MESSAGES.SUCCESS, "Workspaces retrieved successfully", data);
  } catch (err) {
    return errorResponse(res, err.statusCode || STATUS_CODES.BAD_REQUEST, RESPONSE_MESSAGES.ERROR, err.message, err);
  }
};

export const getWorkspaceById = async (req, res) => {
  try {
    const data = await WorkspaceService.getWorkspaceById({
      tenantSchema: req.user.tenantSchema,
      workspaceId: req.params.id,
      userId: req.user.userId,
    });
    return successResponse(res, STATUS_CODES.OK, RESPONSE_MESSAGES.SUCCESS, "Workspace retrieved successfully", data);
  } catch (err) {
    return errorResponse(res, err.statusCode || STATUS_CODES.BAD_REQUEST, RESPONSE_MESSAGES.ERROR, err.message, err);
  }
};

export const createWorkspace = async (req, res) => {
  try {
    const data = await WorkspaceService.createWorkspace({
      tenantSchema: req.user.tenantSchema,
      data: req.body,
      creatorUserId: req.user.userId,
    });
    return successResponse(res, STATUS_CODES.CREATED, RESPONSE_MESSAGES.SUCCESS, "Workspace created successfully", data);
  } catch (err) {
    return errorResponse(res, err.statusCode || STATUS_CODES.BAD_REQUEST, RESPONSE_MESSAGES.ERROR, err.message, err);
  }
};

export const updateWorkspace = async (req, res) => {
  try {
    const data = await WorkspaceService.updateWorkspace({
      tenantSchema: req.user.tenantSchema,
      workspaceId: req.params.id,
      data: req.body,
      userId: req.user.userId,
    });
    return successResponse(res, STATUS_CODES.OK, RESPONSE_MESSAGES.SUCCESS, "Workspace updated successfully", data);
  } catch (err) {
    return errorResponse(res, err.statusCode || STATUS_CODES.BAD_REQUEST, RESPONSE_MESSAGES.ERROR, err.message, err);
  }
};

export const deleteWorkspace = async (req, res) => {
  try {
    const data = await WorkspaceService.deleteWorkspace({
      tenantSchema: req.user.tenantSchema,
      workspaceId: req.params.id,
      userId: req.user.userId,
      userRole: req.user.role,
    });
    return successResponse(res, STATUS_CODES.OK, RESPONSE_MESSAGES.SUCCESS, "Workspace deleted successfully", data);
  } catch (err) {
    return errorResponse(res, err.statusCode || STATUS_CODES.BAD_REQUEST, RESPONSE_MESSAGES.ERROR, err.message, err);
  }
};

// ── Provision / re-provision AI context for a workspace ───────────────────────
// POST /workspace/workspaces/:id/provision-ai
// Idempotent — safe to call multiple times if first attempt failed
export const provisionAIContext = async (req, res) => {
  try {
    const { tenantSchema } = req.user;
    const workspaceId = req.params.id;

    const workspace = await WorkspaceRepository.getWorkspaceById(
      tenantSchema,
      workspaceId
    );
    if (!workspace) {
      return errorResponse(
        res,
        STATUS_CODES.NOT_FOUND,
        RESPONSE_MESSAGES.ERROR,
        "Workspace not found."
      );
    }

    const aiResult = await provisionAIWorkspace({
      workspaceName: workspace.name,
      webhookUrl: envConfig.BACKEND_WEBHOOK_URL,
    });

    await WorkspaceRepository.updateWorkspace(tenantSchema, workspaceId, {
      ai_channel_id: aiResult.channel_id,
    });

    return successResponse(
      res,
      STATUS_CODES.OK,
      RESPONSE_MESSAGES.SUCCESS,
      "AI context provisioned successfully.",
      { ai_channel_id: aiResult.channel_id, workspace_id: workspaceId }
    );
  } catch (err) {
    return errorResponse(
      res,
      err.statusCode || STATUS_CODES.SERVER_ERROR,
      RESPONSE_MESSAGES.ERROR,
      err.message,
      err
    );
  }
};
