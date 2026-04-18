import { Op } from "sequelize";
import { initTenantModels } from "../../models/index.js";

// ─── Org Role Repository ──────────────────────────────────────────────────────

export const getAllRoles = async (schema, filters = {}) => {
  const tenantDb = initTenantModels(schema);
  const { search, skip = 0, limit = 10 } = filters;

  const where = {};
  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } },
    ];
  }

  const { count, rows } = await tenantDb.Role.findAndCountAll({
    where,
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

export const getRoleById = async (schema, id) => {
  const tenantDb = initTenantModels(schema);
  return tenantDb.Role.findOne({ where: { id } });
};

export const getRoleByName = async (schema, name) => {
  const tenantDb = initTenantModels(schema);
  return tenantDb.Role.findOne({ where: { name } });
};

export const createRole = async (schema, data) => {
  const tenantDb = initTenantModels(schema);
  return tenantDb.Role.create(data);
};

export const updateRole = async (schema, id, data) => {
  const tenantDb = initTenantModels(schema);
  await tenantDb.Role.update(data, { where: { id } });
  return getRoleById(schema, id);
};

export const deleteRole = async (schema, id) => {
  const tenantDb = initTenantModels(schema);
  return tenantDb.Role.destroy({ where: { id } });
};
