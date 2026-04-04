import * as PlanRepository from "../../repositories/master/plan.repository.js";

// ─── Plan Service ────────────────────────────────────────────────────────────

export const getAllPlans = async (filters) => {
  try {
    return await PlanRepository.getAllPlans(filters);
  } catch (err) {
    throw {
      statusCode: 500,
      message: "Failed to fetch plans",
      error: err.message,
    };
  }
};

export const getPlanById = async (id) => {
  try {
    if (!id) throw new Error("Plan ID is required");

    const plan = await PlanRepository.getPlanById(id);
    if (!plan) throw new Error("Plan not found");

    return plan;
  } catch (err) {
    throw {
      statusCode: err.statusCode || 404,
      message: err.message,
    };
  }
};

export const createPlan = async (data) => {
  try {
    if (!data.name) throw new Error("Plan name is required");
    if (!data.billing_cycle) throw new Error("Plan billing_cycle is required");
    if (data.price === undefined) throw new Error("Plan price is required");

    return await PlanRepository.createPlan(data);
  } catch (err) {
    throw {
      statusCode: 400,
      message: err.message,
    };
  }
};

export const updatePlan = async (id, data) => {
  try {
    if (!id) throw new Error("Plan ID is required");

    const plan = await PlanRepository.getPlanById(id);
    if (!plan) throw new Error("Plan not found");

    return await PlanRepository.updatePlan(id, data);
  } catch (err) {
    throw {
      statusCode: err.statusCode || 400,
      message: err.message,
    };
  }
};

export const deletePlan = async (id) => {
  try {
    if (!id) throw new Error("Plan ID is required");

    const plan = await PlanRepository.getPlanById(id);
    if (!plan) throw new Error("Plan not found");

    return await PlanRepository.deletePlan(id);
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

export const bulkCreatePlans = async (items) => {
  const succeeded = [];
  const failed = [];
  await Promise.allSettled(
    items.map(async (item) => {
      try {
        const result = await createPlan(item);
        succeeded.push(result);
      } catch (err) {
        failed.push({ item, reason: err.message });
      }
    }),
  );
  return buildBulkResult(succeeded, failed);
};

export const bulkUpdatePlans = async (items) => {
  const succeeded = [];
  const failed = [];
  await Promise.allSettled(
    items.map(async ({ id, ...data }) => {
      try {
        const result = await updatePlan(id, data);
        succeeded.push(result);
      } catch (err) {
        failed.push({ item: { id, ...data }, reason: err.message });
      }
    }),
  );
  return buildBulkResult(succeeded, failed);
};

export const bulkDeletePlans = async (ids) => {
  const succeeded = [];
  const failed = [];
  await Promise.allSettled(
    ids.map(async (id) => {
      try {
        const result = await deletePlan(id);
        succeeded.push(result);
      } catch (err) {
        failed.push({ item: { id }, reason: err.message });
      }
    }),
  );
  return buildBulkResult(succeeded, failed);
};
