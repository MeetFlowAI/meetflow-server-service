import { initTenantModels } from "../../models/index.js";
import { USER_ROLES } from "../../constants/index.js";

// ─── Workspace Member Repository ─────────────────────────────────────────────

export const getWorkspaceMembers = async (
  schema,
  workspaceId,
  filters = {},
) => {
  const tenantDb = initTenantModels(schema);
  const { skip = 0, limit = 50 } = filters;

  const { count, rows } = await tenantDb.WorkspaceMember.findAndCountAll({
    where: { workspace_id: workspaceId },
    include: [
      {
        model: tenantDb.User,
        as: "member",
        attributes: ["id", "first_name", "last_name", "email", "is_active"],
      },
    ],
    offset: parseInt(skip),
    limit: parseInt(limit),
    order: [["createdAt", "ASC"]],
  });

  return {
    data: rows,
    total: count,
    skip: parseInt(skip),
    limit: parseInt(limit),
  };
};

export const getWorkspaceMember = async (schema, workspaceId, userId) => {
  const tenantDb = initTenantModels(schema);
  return tenantDb.WorkspaceMember.findOne({
    where: { workspace_id: workspaceId, user_id: userId },
    include: [
      {
        model: tenantDb.User,
        as: "member",
        attributes: ["id", "first_name", "last_name", "email"],
      },
    ],
  });
};

export const addMemberToWorkspace = async (
  schema,
  workspaceId,
  userId,
  role,
) => {
  const tenantDb = initTenantModels(schema);
  return tenantDb.WorkspaceMember.create({
    workspace_id: workspaceId,
    user_id: userId,
    role: role || USER_ROLES.WORKSPACE.WORKSPACE_MEMBER,
  });
};

export const updateMemberRole = async (schema, workspaceId, userId, role) => {
  const tenantDb = initTenantModels(schema);
  await tenantDb.WorkspaceMember.update(
    { role },
    { where: { workspace_id: workspaceId, user_id: userId } },
  );
  return getWorkspaceMember(schema, workspaceId, userId);
};

export const removeMemberFromWorkspace = async (
  schema,
  workspaceId,
  userId,
) => {
  const tenantDb = initTenantModels(schema);
  return tenantDb.WorkspaceMember.destroy({
    where: { workspace_id: workspaceId, user_id: userId },
  });
};

export const countWorkspaceMembers = async (schema, workspaceId) => {
  const tenantDb = initTenantModels(schema);
  return tenantDb.WorkspaceMember.count({
    where: { workspace_id: workspaceId },
  });
};
