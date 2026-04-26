import * as WorkspaceRepository from "../../repositories/workspace/workspace.repository.js";
import * as WorkspaceMemberRepository from "../../repositories/workspace/workspaceMember.repository.js";
import * as ChannelRepository from "../../repositories/workspace/channel.repository.js";
import * as ChannelMemberRepository from "../../repositories/workspace/channelMember.repository.js";
import * as UserRepository from "../../repositories/organization/user.repository.js";
import { masterDb } from "../../models/index.js";
import { USER_ROLES, WORKSPACE_CHANNEL_TYPES } from "../../constants/index.js";
import { provisionAIWorkspace } from "../ai/ai.service.js";
import { envConfig } from "../../config/env.config.js";

// ─── Plan limit enforcement helper ───────────────────────────────────────────

const enforceOrgLimit = async (tenantSchema, limitKey, currentCount) => {
  const org = await masterDb.Organization.findOne({
    where: { schema_name: tenantSchema },
    attributes: ["plan_id"],
  });
  if (!org?.plan_id) return;

  const limit = await masterDb.PlanLimit.findOne({
    where: { plan_id: org.plan_id, limit_key: limitKey },
  });
  if (!limit) return;
  if (limit.limit_value === -1) return;

  if (currentCount >= limit.limit_value) {
    throw Object.assign(
      new Error(
        `Your plan allows a maximum of ${limit.limit_value} ${limitKey.replace(/_/g, " ")}. ` +
          `Please upgrade your plan to create more.`,
      ),
      { statusCode: 403 },
    );
  }
};

// ─── Workspace Selection ──────────────────────────────────────────────────────

export const getMyWorkspaces = async ({ tenantSchema, userId }) => {
  try {
    const workspaces = await WorkspaceRepository.getWorkspacesForUser(
      tenantSchema,
      userId,
    );
    return workspaces;
  } catch (err) {
    throw {
      statusCode: 500,
      message: "Failed to fetch workspaces",
      error: err.message,
    };
  }
};

// ─── Workspace CRUD ───────────────────────────────────────────────────────────

export const getAllWorkspaces = async ({ tenantSchema, filters }) => {
  try {
    return await WorkspaceRepository.getAllWorkspaces(tenantSchema, filters);
  } catch (err) {
    throw {
      statusCode: 500,
      message: "Failed to fetch workspaces",
      error: err.message,
    };
  }
};

export const getWorkspaceById = async ({
  tenantSchema,
  workspaceId,
  userId,
}) => {
  try {
    const workspace = await WorkspaceRepository.getWorkspaceById(
      tenantSchema,
      workspaceId,
    );
    if (!workspace)
      throw Object.assign(new Error("Workspace not found."), {
        statusCode: 404,
      });

    const membership = await WorkspaceMemberRepository.getWorkspaceMember(
      tenantSchema,
      workspaceId,
      userId,
    );
    if (!membership)
      throw Object.assign(
        new Error("You are not a member of this workspace."),
        { statusCode: 403 },
      );

    return workspace;
  } catch (err) {
    throw { statusCode: err.statusCode || 400, message: err.message };
  }
};

export const createWorkspace = async ({
  tenantSchema,
  data,
  creatorUserId,
}) => {
  try {
    if (!data.name?.trim()) throw new Error("Workspace name is required");

    // Plan limit check
    const currentCount =
      await WorkspaceRepository.countWorkspaces(tenantSchema);
    await enforceOrgLimit(tenantSchema, "max_workspaces", currentCount);

    // Name uniqueness check
    const existing = await WorkspaceRepository.getWorkspaceByName(
      tenantSchema,
      data.name.trim(),
    );
    if (existing)
      throw Object.assign(
        new Error("A workspace with this name already exists."),
        { statusCode: 409 },
      );

    const workspace = await WorkspaceRepository.createWorkspace(tenantSchema, {
      name: data.name.trim(),
      description: data.description || null,
      created_by_id: creatorUserId,
      is_active: true,
    });

    // ── Owner assignment ──────────────────────────────────────────────────────
    // If owner_id is provided and is a valid org member, assign them as workspace_owner.
    // Otherwise fall back to the creator.
    let ownerId = creatorUserId;

    if (data.owner_id && parseInt(data.owner_id) !== parseInt(creatorUserId)) {
      const ownerUser = await UserRepository.getUserById(
        tenantSchema,
        data.owner_id,
      );
      if (!ownerUser || ownerUser.is_deleted) {
        throw Object.assign(
          new Error("Designated workspace owner is not a valid org member."),
          { statusCode: 400 },
        );
      }
      ownerId = data.owner_id;
    }

    // Add owner as workspace_owner
    await WorkspaceMemberRepository.addMemberToWorkspace(
      tenantSchema,
      workspace.id,
      ownerId,
      USER_ROLES.WORKSPACE.WORKSPACE_OWNER,
    );

    // If creator is different from owner, add creator as workspace_admin
    if (parseInt(ownerId) !== parseInt(creatorUserId)) {
      await WorkspaceMemberRepository.addMemberToWorkspace(
        tenantSchema,
        workspace.id,
        creatorUserId,
        USER_ROLES.WORKSPACE.WORKSPACE_ADMIN,
      );
    }

    // ── Bulk add initial members ──────────────────────────────────────────────
    if (Array.isArray(data.member_ids) && data.member_ids.length > 0) {
      const alreadyAdded = new Set([String(ownerId), String(creatorUserId)]);

      for (const memberId of data.member_ids) {
        if (alreadyAdded.has(String(memberId))) continue;

        // Validate each member is a real org user (skip silently if not)
        const orgUser = await UserRepository.getUserById(
          tenantSchema,
          memberId,
        );
        if (!orgUser || orgUser.is_deleted) continue;

        await WorkspaceMemberRepository.addMemberToWorkspace(
          tenantSchema,
          workspace.id,
          memberId,
          USER_ROLES.WORKSPACE.WORKSPACE_MEMBER,
        );

        alreadyAdded.add(String(memberId));
      }
    }

    // ── Auto-create #general channel ─────────────────────────────────────────
    const generalChannel = await ChannelRepository.createChannel(tenantSchema, {
      name: "general",
      description: "General discussion for everyone in this workspace.",
      workspace_id: workspace.id,
      type: WORKSPACE_CHANNEL_TYPES.PUBLIC,
    });

    // Add all workspace members to #general
    const allMembers = await WorkspaceMemberRepository.getWorkspaceMembers(
      tenantSchema,
      workspace.id,
      { skip: 0, limit: 1000 },
    );

    for (const wm of allMembers.data) {
      await ChannelMemberRepository.addMemberToChannel(
        tenantSchema,
        generalChannel.id,
        wm.user_id,
      );
    }

    return workspace;

    // ── Provision AI workspace context (non-blocking) ──────────────────────────
    try {
      const webhookUrl = envConfig.BACKEND_WEBHOOK_URL;
      const aiResult = await provisionAIWorkspace({
        workspaceName: workspace.name,
        webhookUrl,
      });
      // Save AI channel UUID back to workspace record
      await WorkspaceRepository.updateWorkspace(tenantSchema, workspace.id, {
        ai_channel_id: aiResult.channel_id,
      });
      console.log(
        `🤖 AI workspace provisioned for "${workspace.name}" → ${aiResult.channel_id}`,
      );
    } catch (aiErr) {
      // Non-fatal: workspace still works without AI
      console.warn(
        `⚠️ AI workspace provisioning failed (workspace still created): ${aiErr.message}`,
      );
    }

    return workspace;
  } catch (err) {
    throw { statusCode: err.statusCode || 400, message: err.message };
  }
};

export const updateWorkspace = async ({
  tenantSchema,
  workspaceId,
  data,
  userId,
}) => {
  try {
    const workspace = await WorkspaceRepository.getWorkspaceById(
      tenantSchema,
      workspaceId,
    );
    if (!workspace)
      throw Object.assign(new Error("Workspace not found."), {
        statusCode: 404,
      });

    const membership = await WorkspaceMemberRepository.getWorkspaceMember(
      tenantSchema,
      workspaceId,
      userId,
    );
    if (
      !membership ||
      membership.role === USER_ROLES.WORKSPACE.WORKSPACE_MEMBER
    ) {
      throw Object.assign(
        new Error(
          "Only workspace owners and admins can update workspace details.",
        ),
        { statusCode: 403 },
      );
    }

    if (data.name && data.name.trim() !== workspace.name) {
      const existing = await WorkspaceRepository.getWorkspaceByName(
        tenantSchema,
        data.name.trim(),
      );
      if (existing)
        throw Object.assign(
          new Error("A workspace with this name already exists."),
          { statusCode: 409 },
        );
    }

    const allowedFields = {};
    if (data.name) allowedFields.name = data.name.trim();
    if (data.description !== undefined)
      allowedFields.description = data.description;

    return await WorkspaceRepository.updateWorkspace(
      tenantSchema,
      workspaceId,
      allowedFields,
    );
  } catch (err) {
    throw { statusCode: err.statusCode || 400, message: err.message };
  }
};

export const deleteWorkspace = async ({
  tenantSchema,
  workspaceId,
  userId,
  userRole,
}) => {
  try {
    const workspace = await WorkspaceRepository.getWorkspaceById(
      tenantSchema,
      workspaceId,
    );
    if (!workspace)
      throw Object.assign(new Error("Workspace not found."), {
        statusCode: 404,
      });

    const membership = await WorkspaceMemberRepository.getWorkspaceMember(
      tenantSchema,
      workspaceId,
      userId,
    );
    const isOrgSuperAdmin =
      userRole === USER_ROLES.ORGANIZATION.ORGANIZATION_SUPER_ADMIN;
    const isWorkspaceOwner =
      membership?.role === USER_ROLES.WORKSPACE.WORKSPACE_OWNER;

    if (!isOrgSuperAdmin && !isWorkspaceOwner) {
      throw Object.assign(
        new Error(
          "Only the workspace owner or org super admin can delete a workspace.",
        ),
        { statusCode: 403 },
      );
    }

    await WorkspaceRepository.deleteWorkspace(tenantSchema, workspaceId);
    return { success: true };
  } catch (err) {
    throw { statusCode: err.statusCode || 400, message: err.message };
  }
};
