export const createFeatureSchema = {
  feature_key: { required: true, type: "string", minLength: 2, maxLength: 100 },
  name: { required: true, type: "string", minLength: 2, maxLength: 100 },
  description: { required: false, type: "string" },
  is_active: { required: false, type: "boolean" },
};

export const updateFeatureSchema = {
  feature_key: {
    required: false,
    type: "string",
    minLength: 2,
    maxLength: 100,
  },
  name: { required: false, type: "string", minLength: 2, maxLength: 100 },
  description: { required: false, type: "string" },
  is_active: { required: false, type: "boolean" },
};

// ─── Bulk Schemas ─────────────────────────────────────────────────────────────

export const bulkCreateFeatureSchema = {
  feature_key: { required: true, type: "string", minLength: 2, maxLength: 100 },
  name: { required: true, type: "string", minLength: 2, maxLength: 100 },
  description: { required: false, type: "string" },
  is_active: { required: false, type: "boolean" },
};

export const bulkUpdateFeatureSchema = {
  id: { required: true, type: "number" },
  feature_key: { required: false, type: "string", minLength: 2, maxLength: 100 },
  name: { required: false, type: "string", minLength: 2, maxLength: 100 },
  description: { required: false, type: "string" },
  is_active: { required: false, type: "boolean" },
};
