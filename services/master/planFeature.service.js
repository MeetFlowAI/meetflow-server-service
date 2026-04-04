import * as PlanFeatureRepository from "../../repositories/master/planFeature.repository.js";
import * as PlanRepository from "../../repositories/master/plan.repository.js";

// ─── Plan Feature Service ────────────────────────────────────────────────────

export const getFeaturesByPlan = async (planId, filters) => {
  try {
    if (!planId) throw new Error("Plan ID is required");

    const plan = await PlanRepository.getPlanById(planId);
    if (!plan) throw new Error("Plan not found");

    return await PlanFeatureRepository.getFeaturesByPlan(planId, filters);
  } catch (err) {
    throw {
      statusCode: err.statusCode || 500,
      message: err.message,
    };
  }
};

export const assignFeature = async (planId, data) => {
  try {
    if (!planId) throw new Error("Plan ID is required");
    if (!data.feature_id) throw new Error("Feature ID is required");

    const plan = await PlanRepository.getPlanById(planId);
    if (!plan) throw new Error("Plan not found");

    return await PlanFeatureRepository.assignFeature(planId, data.feature_id, data);
  } catch (err) {
    throw {
      statusCode: err.statusCode || 400,
      message: err.message,
    };
  }
};

export const toggleFeature = async (planId, featureId, data) => {
  try {
    if (!planId) throw new Error("Plan ID is required");
    if (!featureId) throw new Error("Feature ID is required");
    if (data.is_active === undefined) throw new Error("is_active is required");

    const plan = await PlanRepository.getPlanById(planId);
    if (!plan) throw new Error("Plan not found");

    const planFeature = await PlanFeatureRepository.getPlanFeatureById(planId, featureId);
    if (!planFeature) throw new Error("Feature not assigned to this plan");

    return await PlanFeatureRepository.toggleFeature(planId, featureId, data);
  } catch (err) {
    throw {
      statusCode: err.statusCode || 400,
      message: err.message,
    };
  }
};

export const removeFeature = async (planId, featureId) => {
  try {
    if (!planId) throw new Error("Plan ID is required");
    if (!featureId) throw new Error("Feature ID is required");

    const plan = await PlanRepository.getPlanById(planId);
    if (!plan) throw new Error("Plan not found");

    const planFeature = await PlanFeatureRepository.getPlanFeatureById(planId, featureId);
    if (!planFeature) throw new Error("Feature not assigned to this plan");

    return await PlanFeatureRepository.removeFeature(planId, featureId);
  } catch (err) {
    throw {
      statusCode: err.statusCode || 400,
      message: err.message,
    };
  }
};

// ─── Bulk helpers ─────────────────────────────────────────────────────────────

const buildBulkResult = (succeeded, failed) => ({
  succeeded,
  failed,
  summary: { total: succeeded.length + failed.length, success: succeeded.length, failed: failed.length },
});

// ─── Bulk Services ────────────────────────────────────────────────────────────

/**
 * Bulk assign features to a plan.
 * Each item: { feature_id, is_active? }
 */
export const bulkAssignFeatures = async (planId, items) => {
  const succeeded = [];
  const failed = [];
  await Promise.allSettled(
    items.map(async (item) => {
      try {
        const result = await assignFeature(planId, item);
        succeeded.push(result);
      } catch (err) {
        failed.push({ item, reason: err.message });
      }
    }),
  );
  return buildBulkResult(succeeded, failed);
};

/**
 * Bulk remove features from a plan.
 * featureIds: number[]
 */
export const bulkRemoveFeatures = async (planId, featureIds) => {
  const succeeded = [];
  const failed = [];
  await Promise.allSettled(
    featureIds.map(async (featureId) => {
      try {
        await removeFeature(planId, featureId);
        succeeded.push({ planId, featureId });
      } catch (err) {
        failed.push({ item: { planId, featureId }, reason: err.message });
      }
    }),
  );
  return buildBulkResult(succeeded, failed);
};
