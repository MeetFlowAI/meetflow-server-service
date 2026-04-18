import * as WorkspaceRepository from "../../repositories/workspace/workspace.repository.js";
import * as WorkspaceMemberRepository from "../../repositories/workspace/workspaceMember.repository.js";
import * as ChannelRepository from "../../repositories/workspace/channel.repository.js";
import * as ChannelMemberRepository from "../../repositories/workspace/channelMember.repository.js";
import { masterDb } from "../../models/index.js";
import { USER_ROLES, WORKSPACE_CHANNEL_TYPES } from "../../constants/index.js";

// ─── Plan limit enforcement helper ───────────────────────────────────────────

/**
 * Fetch the org's plan limit for a given key, then compare against current usage.
 * Throws 403 if the limit is reached.
 * limit_value = -1 means unlimited.
 */
const enforceOrgLimit = async (tenantSchema, limitKey, currentCount) => {
  const org = await masterDb.Organization.findOne({
    where: { schema_name: tenantSchema },
    attributes: ["plan_id"],
  });
  if (!org?.plan_id) return; // no plan → no enforcement (shouldn't happen in prod)

  const limit = await masterDb.PlanLimit.findOne({
    where: { plan_id: org.plan_id, limit_key: limitKey },
  });
  if (!limit) return; // limit not configured → allow

  if (limit.limit_value === -1) return; // -1 = unlimited

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

/**
 * Returns all workspaces the requesting user belongs to.
 * This is the data source for the workspace selection screen shown after login.
 */
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

    // Ensure the requesting user is a member
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

    // Auto-add the creator as workspace_owner
    await WorkspaceMemberRepository.addMemberToWorkspace(
      tenantSchema,
      workspace.id,
      creatorUserId,
      USER_ROLES.WORKSPACE.WORKSPACE_OWNER,
    );

    // Auto-create a default #general public channel
    const generalChannel = await ChannelRepository.createChannel(tenantSchema, {
      name: "general",
      description: "General discussion for everyone in this workspace.",
      workspace_id: workspace.id,
      type: WORKSPACE_CHANNEL_TYPES.PUBLIC,
    });

    // Add the creator to the general channel
    await ChannelMemberRepository.addMemberToChannel(
      tenantSchema,
      generalChannel.id,
      creatorUserId,
    );

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

    // Only workspace owner or org admin roles can update
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

    // Only org super admin or the workspace owner can delete
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
