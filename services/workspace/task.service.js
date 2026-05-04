/**
 * services/workspace/task.service.js
 *
 * All task business logic lives here.
 *
 * Key flows:
 *   createTask   → validate workspace/channel access → create task
 *   getTasks     → paginated list for a channel with optional filters
 *   updateTask   → ownership/permission check → update fields
 *   deleteTask   → ownership/permission check → delete
 */

import * as TaskRepository from "../../repositories/workspace/task.repository.js";
import * as WorkspaceMemberRepository from "../../repositories/workspace/workspaceMember.repository.js";
import * as ChannelRepository from "../../repositories/workspace/channel.repository.js";
import * as WorkspaceRepository from "../../repositories/workspace/workspace.repository.js";
import { USER_ROLES } from "../../constants/index.js";

// ─── Shared access validation (reuse the same shape as meeting.service.js) ────

const validateChannelAccess = async (
  tenantSchema,
  workspaceId,
  channelId,
  userId,
) => {
  const workspace = await WorkspaceRepository.getWorkspaceById(
    tenantSchema,
    workspaceId,
  );
  if (!workspace) {
    throw Object.assign(new Error("Workspace not found."), { statusCode: 404 });
  }

  const channel = await ChannelRepository.getChannelById(
    tenantSchema,
    channelId,
  );
  if (!channel || String(channel.workspace_id) !== String(workspaceId)) {
    throw Object.assign(new Error("Channel not found."), { statusCode: 404 });
  }

  const membership = await WorkspaceMemberRepository.getWorkspaceMember(
    tenantSchema,
    workspaceId,
    userId,
  );
  if (!membership) {
    throw Object.assign(new Error("You are not a member of this workspace."), {
      statusCode: 403,
    });
  }

  return { workspace, channel, membership };
};

// Can the user modify/delete this task?
const canMutateTask = (task, userId, membership) => {
  const isCreator = String(task.created_by_id) === String(userId);
  const isElevated = [
    USER_ROLES.WORKSPACE.WORKSPACE_OWNER,
    USER_ROLES.WORKSPACE.WORKSPACE_ADMIN,
  ].includes(membership.role);
  return isCreator || isElevated;
};

// ─── CREATE TASK ──────────────────────────────────────────────────────────────

export const createTask = async ({
  tenantSchema,
  workspaceId,
  channelId,
  userId,
  title,
  description,
  priority,
  assignedToId,
  dueDate,
}) => {
  try {
    await validateChannelAccess(tenantSchema, workspaceId, channelId, userId);

    const task = await TaskRepository.createTask(tenantSchema, {
      channel_id: channelId,
      workspace_id: workspaceId,
      title: title.trim(),
      description: description?.trim() ?? null,
      status: "todo",
      priority: priority ?? "medium",
      assigned_to_id: assignedToId ?? null,
      created_by_id: userId,
      due_date: dueDate ?? null,
      source: "manual",
    });

    // Fetch with includes so response shape matches list endpoint
    return await TaskRepository.getTaskById(tenantSchema, task.id);
  } catch (err) {
    throw { statusCode: err.statusCode || 500, message: err.message };
  }
};

// ─── GET TASKS ────────────────────────────────────────────────────────────────

export const getTasks = async ({
  tenantSchema,
  workspaceId,
  channelId,
  userId,
  skip,
  limit,
  status,
  priority,
}) => {
  try {
    const membership = await WorkspaceMemberRepository.getWorkspaceMember(
      tenantSchema,
      workspaceId,
      userId,
    );
    if (!membership) {
      throw Object.assign(
        new Error("You are not a member of this workspace."),
        { statusCode: 403 },
      );
    }

    return await TaskRepository.getTasksByChannel(tenantSchema, channelId, {
      skip,
      limit,
      status,
      priority,
    });
  } catch (err) {
    throw { statusCode: err.statusCode || 500, message: err.message };
  }
};

// ─── UPDATE TASK ──────────────────────────────────────────────────────────────

export const updateTask = async ({
  tenantSchema,
  workspaceId,
  channelId,
  taskId,
  userId,
  title,
  description,
  status,
  priority,
  assignedToId,
  dueDate,
}) => {
  try {
    const membership = await WorkspaceMemberRepository.getWorkspaceMember(
      tenantSchema,
      workspaceId,
      userId,
    );
    if (!membership) {
      throw Object.assign(
        new Error("You are not a member of this workspace."),
        { statusCode: 403 },
      );
    }

    const task = await TaskRepository.getTaskById(tenantSchema, taskId);
    if (!task) {
      throw Object.assign(new Error("Task not found."), { statusCode: 404 });
    }
    if (String(task.channel_id) !== String(channelId)) {
      throw Object.assign(new Error("Task not found in this channel."), {
        statusCode: 404,
      });
    }

    if (!canMutateTask(task, userId, membership)) {
      throw Object.assign(
        new Error("Only the task creator or a workspace admin can edit tasks."),
        { statusCode: 403 },
      );
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined)
      updateData.description = description?.trim() ?? null;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (assignedToId !== undefined) updateData.assigned_to_id = assignedToId;
    if (dueDate !== undefined) updateData.due_date = dueDate;

    await TaskRepository.updateTask(tenantSchema, taskId, updateData);
    return await TaskRepository.getTaskById(tenantSchema, taskId);
  } catch (err) {
    throw { statusCode: err.statusCode || 500, message: err.message };
  }
};

// ─── DELETE TASK ──────────────────────────────────────────────────────────────

export const deleteTask = async ({
  tenantSchema,
  workspaceId,
  channelId,
  taskId,
  userId,
}) => {
  try {
    const membership = await WorkspaceMemberRepository.getWorkspaceMember(
      tenantSchema,
      workspaceId,
      userId,
    );
    if (!membership) {
      throw Object.assign(
        new Error("You are not a member of this workspace."),
        { statusCode: 403 },
      );
    }

    const task = await TaskRepository.getTaskById(tenantSchema, taskId);
    if (!task) {
      throw Object.assign(new Error("Task not found."), { statusCode: 404 });
    }
    if (String(task.channel_id) !== String(channelId)) {
      throw Object.assign(new Error("Task not found in this channel."), {
        statusCode: 404,
      });
    }

    if (!canMutateTask(task, userId, membership)) {
      throw Object.assign(
        new Error(
          "Only the task creator or a workspace admin can delete tasks.",
        ),
        { statusCode: 403 },
      );
    }

    await TaskRepository.deleteTask(tenantSchema, taskId);
    return { id: taskId };
  } catch (err) {
    throw { statusCode: err.statusCode || 500, message: err.message };
  }
};
