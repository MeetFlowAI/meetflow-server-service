import * as PlanLimitRepository from "../../repositories/master/planLimit.repository.js";
import * as PlanRepository from "../../repositories/master/plan.repository.js";

// ─── Plan Limit Service ───────────────────────────────────────────────────────

export const getLimitsByPlan = async (planId, filters) => {
  try {
    if (!planId) throw new Error("Plan ID is required");

    const plan = await PlanRepository.getPlanById(planId);
    if (!plan) throw new Error("Plan not found");

    return await PlanLimitRepository.getLimitsByPlan(planId, filters);
  } catch (err) {
    throw {
      statusCode: err.statusCode || 500,
      message: err.message,
    };
  }
};

export const addLimit = async (planId, data) => {
  try {
    if (!planId) throw new Error("Plan ID is required");
    if (!data.limit_key) throw new Error("Limit key is required");
    if (data.limit_value === undefined) throw new Error("Limit value is required");

    const plan = await PlanRepository.getPlanById(planId);
    if (!plan) throw new Error("Plan not found");

    return await PlanLimitRepository.addLimit(planId, data);
  } catch (err) {
    throw {
      statusCode: err.statusCode || 400,
      message: err.message,
    };
  }
};

export const updateLimit = async (planId, limitId, data) => {
  try {
    if (!planId) throw new Error("Plan ID is required");
    if (!limitId) throw new Error("Limit ID is required");

    const plan = await PlanRepository.getPlanById(planId);
    if (!plan) throw new Error("Plan not found");

    const limit = await PlanLimitRepository.getPlanLimitById(planId, limitId);
    if (!limit) throw new Error("Limit not found for this plan");

    return await PlanLimitRepository.updateLimit(planId, limitId, data);
  } catch (err) {
    throw {
      statusCode: err.statusCode || 400,
      message: err.message,
    };
  }
};

export const deleteLimit = async (planId, limitId) => {
  try {
    if (!planId) throw new Error("Plan ID is required");
    if (!limitId) throw new Error("Limit ID is required");

    const plan = await PlanRepository.getPlanById(planId);
    if (!plan) throw new Error("Plan not found");

    const limit = await PlanLimitRepository.getPlanLimitById(planId, limitId);
    if (!limit) throw new Error("Limit not found for this plan");

    return await PlanLimitRepository.deleteLimit(planId, limitId);
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
 * Bulk add limits to a plan.
 * Each item: { limit_key, limit_value }
 */
export const bulkAddLimits = async (planId, items) => {
  const succeeded = [];
  const failed = [];
  await Promise.allSettled(
    items.map(async (item) => {
      try {
        const result = await addLimit(planId, item);
        succeeded.push(result);
      } catch (err) {
        failed.push({ item, reason: err.message });
      }
    }),
  );
  return buildBulkResult(succeeded, failed);
};

/**
 * Bulk delete limits from a plan.
 * limitIds: number[]
 */
export const bulkDeleteLimits = async (planId, limitIds) => {
  const succeeded = [];
  const failed = [];
  await Promise.allSettled(
    limitIds.map(async (limitId) => {
      try {
        await deleteLimit(planId, limitId);
        succeeded.push({ planId, limitId });
      } catch (err) {
        failed.push({ item: { planId, limitId }, reason: err.message });
      }
    }),
  );
  return buildBulkResult(succeeded, failed);
};
