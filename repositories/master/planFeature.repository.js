import { masterDb } from "../../models/index.js";

// ─── Plan Feature Repository ──────────────────────────────────────────────────

export const getFeaturesByPlan = async (planId, filters = {}) => {
  const { skip = 0, limit = 10 } = filters;

  const { count, rows } = await masterDb.PlanFeature.findAndCountAll({
    where: { plan_id: planId },
    // ✅ REMOVED: include of Feature via PlanFeature junction table
    // PlanFeature has no direct hasOne/belongsTo → Feature association.
    // Plan<->Feature is belongsToMany (M:N) through PlanFeature.
    // Including Feature here would require going through Plan, not PlanFeature directly.
    // The raw PlanFeature rows (plan_id, feature_id, is_active) are sufficient here.
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

export const getPlanFeatureById = async (planId, featureId) => {
  return masterDb.PlanFeature.findOne({
    where: { plan_id: planId, feature_id: featureId },
  });
};

export const assignFeature = async (planId, featureId, data = {}) => {
  await masterDb.PlanFeature.create({
    plan_id: planId,
    feature_id: featureId,
    is_active: data.is_active !== undefined ? data.is_active : true,
  });
  return getPlanFeatureById(planId, featureId);
};

export const toggleFeature = async (planId, featureId, data) => {
  await masterDb.PlanFeature.update(
    { is_active: data.is_active },
    { where: { plan_id: planId, feature_id: featureId } },
  );
  return getPlanFeatureById(planId, featureId);
};

export const removeFeature = async (planId, featureId) => {
  return masterDb.PlanFeature.destroy({
    where: { plan_id: planId, feature_id: featureId },
  });
};
