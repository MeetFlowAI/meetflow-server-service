/**
 * controllers/workspace/task.controller.js
 *
 * Thin layer: parse request → call service → send response.
 * Zero business logic here.
 */

import * as TaskService from "../../services/workspace/task.service.js";
import { successResponse, errorResponse } from "../../utils/response.util.js";
import { STATUS_CODES, RESPONSE_MESSAGES } from "../../constants/response.js";

// POST /workspace/:workspaceId/channels/:channelId/tasks
export const createTask = async (req, res) => {
  try {
    const data = await TaskService.createTask({
      tenantSchema: req.user.tenantSchema,
      workspaceId: req.params.workspaceId,
      channelId: req.params.channelId,
      userId: req.user.userId,
      title: req.body.title,
      description: req.body.description,
      priority: req.body.priority,
      assignedToId: req.body.assigned_to_id ?? null,
      dueDate: req.body.due_date ?? null,
    });
    return successResponse(
      res,
      STATUS_CODES.CREATED,
      RESPONSE_MESSAGES.SUCCESS,
      "Task created successfully",
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

// GET /workspace/:workspaceId/channels/:channelId/tasks
export const getTasks = async (req, res) => {
  try {
    const { skip = 0, limit = 50, status, priority, search } = req.query;
    const data = await TaskService.getTasks({
      tenantSchema: req.user.tenantSchema,
      workspaceId: req.params.workspaceId,
      channelId: req.params.channelId,
      userId: req.user.userId,
      skip: parseInt(skip),
      limit: parseInt(limit),
      status: status || undefined,
      priority: priority || undefined,
      search: search?.toString().trim() || undefined,
    });
    return successResponse(
      res,
      STATUS_CODES.OK,
      RESPONSE_MESSAGES.SUCCESS,
      "Tasks retrieved successfully",
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

// PATCH /workspace/:workspaceId/channels/:channelId/tasks/:taskId
export const updateTask = async (req, res) => {
  try {
    const data = await TaskService.updateTask({
      tenantSchema: req.user.tenantSchema,
      workspaceId: req.params.workspaceId,
      channelId: req.params.channelId,
      taskId: req.params.taskId,
      userId: req.user.userId,
      title: req.body.title,
      description: req.body.description,
      status: req.body.status,
      priority: req.body.priority,
      assignedToId: req.body.assigned_to_id,
      dueDate: req.body.due_date,
    });
    return successResponse(
      res,
      STATUS_CODES.OK,
      RESPONSE_MESSAGES.SUCCESS,
      "Task updated successfully",
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

// DELETE /workspace/:workspaceId/channels/:channelId/tasks/:taskId
export const deleteTask = async (req, res) => {
  try {
    const data = await TaskService.deleteTask({
      tenantSchema: req.user.tenantSchema,
      workspaceId: req.params.workspaceId,
      channelId: req.params.channelId,
      taskId: req.params.taskId,
      userId: req.user.userId,
    });
    return successResponse(
      res,
      STATUS_CODES.OK,
      RESPONSE_MESSAGES.SUCCESS,
      "Task deleted successfully",
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
