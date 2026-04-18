import { Op } from "sequelize";
import { initTenantModels } from "../../models/index.js";

// ─── Workspace Repository ─────────────────────────────────────────────────────

export const getAllWorkspaces = async (schema, filters = {}) => {
  const tenantDb = initTenantModels(schema);
  const { search, skip = 0, limit = 50, is_active } = filters;

  const where = {};
  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } },
    ];
  }
  if (is_active !== undefined) {
    where.is_active = is_active === "true" || is_active === true;
  }

  const { count, rows } = await tenantDb.Workspace.findAndCountAll({
    where,
    include: [
      {
        model: tenantDb.User,
        as: "creator",
        attributes: ["id", "first_name", "last_name", "email"],
      },
    ],
    offset: parseInt(skip),
    limit: parseInt(limit),
    order: [["createdAt", "DESC"]],
  });

  return {
    data: rows,
    total: count,
    skip: parseInt(skip),
    limit: parseInt(limit),
  };
};

export const getWorkspaceById = async (schema, workspaceId) => {
  const tenantDb = initTenantModels(schema);
  return tenantDb.Workspace.findOne({
    where: { id: workspaceId },
    include: [
      {
        model: tenantDb.User,
        as: "creator",
        attributes: ["id", "first_name", "last_name", "email"],
      },
    ],
  });
};

export const getWorkspaceByName = async (schema, name) => {
  const tenantDb = initTenantModels(schema);
  return tenantDb.Workspace.findOne({ where: { name } });
};

export const createWorkspace = async (schema, data) => {
  const tenantDb = initTenantModels(schema);
  return tenantDb.Workspace.create(data);
};

export const updateWorkspace = async (schema, workspaceId, data) => {
  const tenantDb = initTenantModels(schema);
  await tenantDb.Workspace.update(data, { where: { id: workspaceId } });
  return getWorkspaceById(schema, workspaceId);
};

export const deleteWorkspace = async (schema, workspaceId) => {
  const tenantDb = initTenantModels(schema);
  return tenantDb.Workspace.update(
    { is_active: false },
    { where: { id: workspaceId } },
  );
};

export const countWorkspaces = async (schema) => {
  const tenantDb = initTenantModels(schema);
  return tenantDb.Workspace.count({ where: { is_active: true } });
};

/**
 * Get all workspaces a specific user belongs to.
 * Used for the workspace selection screen after login.
 */
export const getWorkspacesForUser = async (schema, userId) => {
  const tenantDb = initTenantModels(schema);
  return tenantDb.Workspace.findAll({
    where: { is_active: true },
    include: [
      {
        model: tenantDb.User,
        where: { id: userId },
        attributes: [],
        through: { attributes: ["role"] },
      },
    ],
    order: [["createdAt", "ASC"]],
  });
};
