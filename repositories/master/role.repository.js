import { Op } from "sequelize";
import { masterDb } from "../../models/index.js";

// ─── Role Repository ──────────────────────────────────────────────────────────

export const getAllRoles = async (filters = {}) => {
  const { search, skip = 0, limit = 10, is_active } = filters;

  // ✅ MasterRole model has no isDeleted field — removed that filter
  const where = {};

  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } },
    ];
  }

  // ✅ FIXED: coerce string "true"/"false" from query params to boolean
  if (is_active !== undefined) {
    where.is_active = is_active === "true" || is_active === true;
  }

  const { count, rows } = await masterDb.MasterRole.findAndCountAll({
    where,
    offset: parseInt(skip),
    limit: parseInt(limit),
    order: [["createdAt", "DESC"]], // ✅ FIXED: camelCase — no underscored:true on model
  });

  return {
    data: rows,
    total: count,
    skip: parseInt(skip),
    limit: parseInt(limit),
  };
};

export const getRoleById = async (id) => {
  // ✅ MasterRole model has no isDeleted field — removed that filter
  return masterDb.MasterRole.findOne({ where: { id } });
};

export const createRole = async (data) => {
  return masterDb.MasterRole.create(data);
};

export const updateRole = async (id, data) => {
  await masterDb.MasterRole.update(data, { where: { id } });
  return getRoleById(id);
};

export const deleteRole = async (id) => {
  // ✅ MasterRole model has no isDeleted field — only toggle is_active
  await masterDb.MasterRole.update({ is_active: false }, { where: { id } });
  return getRoleById(id);
};

export const hardDeleteRole = async (id) => {
  return masterDb.MasterRole.destroy({ where: { id } });
};
