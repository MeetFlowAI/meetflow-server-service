import { PLAN_BILLING_CYCLES } from "../../constants/index.js";

const billingCycles = Object.values(PLAN_BILLING_CYCLES);

export const createPlanSchema = {
  name: { required: true, type: "string", minLength: 2, maxLength: 70 },
  description: { required: false, type: "string" },
  price: { required: true, type: "number", min: 0 },
  billing_cycle: { required: true, type: "string", isEnum: billingCycles },
  is_active: { required: false, type: "boolean" },
};

export const updatePlanSchema = {
  name: { required: false, type: "string", minLength: 2, maxLength: 70 },
  description: { required: false, type: "string" },
  price: { required: false, type: "number", min: 0 },
  billing_cycle: { required: false, type: "string", isEnum: billingCycles },
  is_active: { required: false, type: "boolean" },
};

export const addLimitSchema = {
  limit_key: { required: true, type: "string", minLength: 1, maxLength: 100 },
  limit_value: { required: true, type: "number", min: -1 },
};

export const updateLimitSchema = {
  limit_value: { required: true, type: "number", min: -1 },
};

export const assignFeatureSchema = {
  feature_id: { required: true, type: "number" },
  is_active: { required: false, type: "boolean" },
};

export const toggleFeatureSchema = {
  is_active: { required: true, type: "boolean" },
};

// ─── Bulk Schemas ─────────────────────────────────────────────────────────────

export const bulkCreatePlanSchema = {
  name: { required: true, type: "string", minLength: 2, maxLength: 70 },
  description: { required: false, type: "string" },
  price: { required: true, type: "number", min: 0 },
  billing_cycle: { required: true, type: "string", isEnum: billingCycles },
  is_active: { required: false, type: "boolean" },
};

export const bulkUpdatePlanSchema = {
  id: { required: true, type: "number" },
  name: { required: false, type: "string", minLength: 2, maxLength: 70 },
  description: { required: false, type: "string" },
  price: { required: false, type: "number", min: 0 },
  billing_cycle: { required: false, type: "string", isEnum: billingCycles },
  is_active: { required: false, type: "boolean" },
};

export const bulkAssignFeaturesSchema = {
  feature_id: { required: true, type: "number" },
  is_active: { required: false, type: "boolean" },
};

export const bulkAddLimitsSchema = {
  limit_key: { required: true, type: "string", minLength: 1, maxLength: 100 },
  limit_value: { required: true, type: "number", min: -1 },
};
