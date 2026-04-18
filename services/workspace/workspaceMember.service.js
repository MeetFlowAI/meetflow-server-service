import * as WorkspaceRepository from "../../repositories/workspace/workspace.repository.js";
import * as WorkspaceUserRepository from "../../repositories/workspace/workspaceMember.repository.js";
import * as UserRepository from "../../repositories/organization/user.repository.js";
import { USER_ROLES } from "../../constants/index.js";

// ─── Workspace Member Service ─────────────────────────────────────────────────

export const getWorkspaceMembers = async ({
  tenantSchema,
  workspaceId,
  filters,
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
    return await WorkspaceUserRepository.getWorkspaceMembers(
      tenantSchema,
      workspaceId,
      filters,
    );
  } catch (err) {
    throw { statusCode: err.statusCode || 500, message: err.message };
  }
};

export const addMember = async ({
  tenantSchema,
  workspaceId,
  data,
  requestingUserRole,
}) => {
  try {
    const { user_id, role } = data;
    if (!user_id) throw new Error("user_id is required");

    const workspace = await WorkspaceRepository.getWorkspaceById(
      tenantSchema,
      workspaceId,
    );
    if (!workspace)
      throw Object.assign(new Error("Workspace not found."), {
        statusCode: 404,
      });

    // Requesting user must be workspace owner/admin or org admin+
    const isOrgAdmin = [
      USER_ROLES.ORGANIZATION.ORGANIZATION_SUPER_ADMIN,
      USER_ROLES.ORGANIZATION.ORGANIZATION_ADMIN,
    ].includes(requestingUserRole);

    if (!isOrgAdmin) {
      throw Object.assign(
        new Error("Only workspace admins or org admins can add members."),
        { statusCode: 403 },
      );
    }

    // User must be an org member
    const orgMember = await UserRepository.getUserById(tenantSchema, user_id);
    if (!orgMember || orgMember.is_deleted) {
      throw Object.assign(
        new Error("User is not a member of this organization."),
        { statusCode: 404 },
      );
    }

    // Check not already a member
    const existing = await WorkspaceUserRepository.getWorkspaceMember(
      tenantSchema,
      workspaceId,
      user_id,
    );
    if (existing) {
      throw Object.assign(
        new Error("User is already a member of this workspace."),
        { statusCode: 409 },
      );
    }

    const validRoles = Object.values(USER_ROLES.WORKSPACE);
    const assignedRole = validRoles.includes(role)
      ? role
      : USER_ROLES.WORKSPACE.WORKSPACE_MEMBER;

    return await WorkspaceUserRepository.addMemberToWorkspace(
      tenantSchema,
      workspaceId,
      user_id,
      assignedRole,
    );
  } catch (err) {
    throw { statusCode: err.statusCode || 400, message: err.message };
  }
};

export const updateMemberRole = async ({
  tenantSchema,
  workspaceId,
  userId,
  role,
  requestingUserId,
}) => {
  try {
    if (parseInt(userId) === parseInt(requestingUserId)) {
      throw Object.assign(
        new Error("You cannot change your own workspace role."),
        { statusCode: 400 },
      );
    }

    const validRoles = Object.values(USER_ROLES.WORKSPACE);
    if (!validRoles.includes(role)) {
      throw Object.assign(
        new Error(`Role must be one of: ${validRoles.join(", ")}`),
        { statusCode: 400 },
      );
    }

    const member = await WorkspaceUserRepository.getWorkspaceMember(
      tenantSchema,
      workspaceId,
      userId,
    );
    if (!member)
      throw Object.assign(new Error("Member not found in this workspace."), {
        statusCode: 404,
      });

    // Cannot demote the workspace owner
    if (
      member.role === USER_ROLES.WORKSPACE.WORKSPACE_OWNER &&
      role !== USER_ROLES.WORKSPACE.WORKSPACE_OWNER
    ) {
      throw Object.assign(
        new Error("Cannot change the role of the workspace owner."),
        { statusCode: 403 },
      );
    }

    return await WorkspaceUserRepository.updateMemberRole(
      tenantSchema,
      workspaceId,
      userId,
      role,
    );
  } catch (err) {
    throw { statusCode: err.statusCode || 400, message: err.message };
  }
};

export const removeMember = async ({
  tenantSchema,
  workspaceId,
  userId,
  requestingUserId,
  requestingUserRole,
}) => {
  try {
    if (parseInt(userId) === parseInt(requestingUserId)) {
      throw Object.assign(
        new Error("Use the 'leave workspace' endpoint to remove yourself."),
        { statusCode: 400 },
      );
    }

    const member = await WorkspaceUserRepository.getWorkspaceMember(
      tenantSchema,
      workspaceId,
      userId,
    );
    if (!member)
      throw Object.assign(new Error("Member not found in this workspace."), {
        statusCode: 404,
      });

    if (member.role === USER_ROLES.WORKSPACE.WORKSPACE_OWNER) {
      throw Object.assign(new Error("The workspace owner cannot be removed."), {
        statusCode: 403,
      });
    }

    await WorkspaceUserRepository.removeMemberFromWorkspace(
      tenantSchema,
      workspaceId,
      userId,
    );
    return { success: true };
  } catch (err) {
    throw { statusCode: err.statusCode || 400, message: err.message };
  }
};
