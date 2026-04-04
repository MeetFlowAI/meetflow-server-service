import { masterDb } from "../../models/index.js";

// ─── Plan Limit Repository ────────────────────────────────────────────────────

export const getLimitsByPlan = async (planId, filters = {}) => {
  const { skip = 0, limit = 10 } = filters;

  const { count, rows } = await masterDb.PlanLimit.findAndCountAll({
    where: { plan_id: planId },
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

export const getPlanLimitById = async (planId, limitId) => {
  return masterDb.PlanLimit.findOne({
    where: { plan_id: planId, id: limitId },
  });
};

export const addLimit = async (planId, data) => {
  const record = await masterDb.PlanLimit.create({
    plan_id: planId,
    limit_key: data.limit_key,
    limit_value: data.limit_value,
  });
  return getPlanLimitById(planId, record.id);
};

export const updateLimit = async (planId, limitId, data) => {
  const updateData = {};
  if (data.limit_key !== undefined) updateData.limit_key = data.limit_key;
  if (data.limit_value !== undefined) updateData.limit_value = data.limit_value;

  await masterDb.PlanLimit.update(updateData, {
    where: { plan_id: planId, id: limitId },
  });
  return getPlanLimitById(planId, limitId);
};

export const deleteLimit = async (planId, limitId) => {
  return masterDb.PlanLimit.destroy({
    where: { plan_id: planId, id: limitId },
  });
};
