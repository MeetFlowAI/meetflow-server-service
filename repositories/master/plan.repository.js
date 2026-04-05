import { Op } from "sequelize";
import { masterDb } from "../../models/index.js";

// ─── Plan Repository ──────────────────────────────────────────────────────────

export const getAllPlans = async (filters = {}) => {
  const { search, skip = 0, limit = 10, is_active, billing_cycle } = filters;

  // ✅ Plan model has no isDeleted field — removed that filter
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
  if (billing_cycle) where.billing_cycle = billing_cycle;

  const { count, rows } = await masterDb.Plan.findAndCountAll({
    where,
    offset: parseInt(skip),
    limit: parseInt(limit),
    order: [["created_at", "DESC"]], // ✅ FIXED: snake_case — models use underscored:true
  });

  return {
    data: rows,
    total: count,
    skip: parseInt(skip),
    limit: parseInt(limit),
  };
};

export const getPlanById = async (id) => {
  // ✅ Plan model has no isDeleted field — removed that filter
  return masterDb.Plan.findOne({ where: { id } });
};

export const createPlan = async (data) => {
  return masterDb.Plan.create(data);
};

export const updatePlan = async (id, data) => {
  await masterDb.Plan.update(data, { where: { id } });
  return getPlanById(id);
};

export const deletePlan = async (id) => {
  // ✅ Plan model has no isDeleted field — only toggle is_active
  await masterDb.Plan.update({ is_active: false }, { where: { id } });
  return getPlanById(id);
};

export const hardDeletePlan = async (id) => {
  return masterDb.Plan.destroy({ where: { id } });
};
