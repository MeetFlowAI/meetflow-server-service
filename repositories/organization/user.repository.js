import { Op } from "sequelize";
import { initTenantModels } from "../../models/index.js";

// ─── User Repository ────────────────────────────────────────────────────────
// All queries operate inside the org's tenant schema.
// initTenantModels(schema) is called per-request — the cache ensures no re-definition.

export const getAllUsers = async (schema, filters = {}) => {
  const tenantDb = initTenantModels(schema);
  const { search, skip = 0, limit = 10, is_active, role_id } = filters;

  const where = { is_deleted: false };

  if (search) {
    where[Op.or] = [
      { first_name: { [Op.iLike]: `%${search}%` } },
      { last_name: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } },
    ];
  }

  if (is_active !== undefined) {
    where.is_active = is_active === "true" || is_active === true;
  }

  if (role_id) {
    where.role_id = parseInt(role_id);
  }

  const { count, rows } = await tenantDb.User.findAndCountAll({
    where,
    attributes: {
      exclude: [
        "password",
        "password_reset_token",
        "password_reset_expires_at",
      ],
    },
    include: [
      {
        model: tenantDb.Role,
        as: "role",
        attributes: ["id", "name"],
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

export const getUserById = async (schema, userId) => {
  const tenantDb = initTenantModels(schema);
  return tenantDb.User.findOne({
    where: { id: userId, is_deleted: false },
    attributes: {
      exclude: [
        "password",
        "password_reset_token",
        "password_reset_expires_at",
      ],
    },
    include: [
      {
        model: tenantDb.Role,
        as: "role",
        attributes: ["id", "name"],
      },
    ],
  });
};

export const getUserByEmail = async (schema, email) => {
  const tenantDb = initTenantModels(schema);
  return tenantDb.User.findOne({
    where: { email: email.toLowerCase(), is_deleted: false },
  });
};

export const updateUserRole = async (schema, userId, roleId) => {
  const tenantDb = initTenantModels(schema);
  await tenantDb.User.update({ role_id: roleId }, { where: { id: userId } });
  return getUserById(schema, userId);
};

export const deactivateUser = async (schema, userId) => {
  const tenantDb = initTenantModels(schema);
  await tenantDb.User.update({ is_active: false }, { where: { id: userId } });
  return getUserById(schema, userId);
};

export const activateUser = async (schema, userId) => {
  const tenantDb = initTenantModels(schema);
  await tenantDb.User.update({ is_active: true }, { where: { id: userId } });
  return getUserById(schema, userId);
};

export const removeUser = async (schema, userId) => {
  const tenantDb = initTenantModels(schema);
  return tenantDb.User.update(
    { is_deleted: true, is_active: false },
    { where: { id: userId } },
  );
};

export const countActiveUsers = async (schema) => {
  const tenantDb = initTenantModels(schema);
  return tenantDb.User.count({ where: { is_deleted: false, is_active: true } });
};
