export const createRoleSchema = {
  name: { required: true, type: "string", minLength: 2, maxLength: 70 },
  display_name: { required: true, type: "string", minLength: 2, maxLength: 70 },
  description: { required: false, type: "string", maxLength: 255 },
  is_system: { required: false, type: "boolean" },
};

export const updateRoleSchema = {
  name: { required: false, type: "string", minLength: 2, maxLength: 70 },
  display_name: { required: true, type: "string", minLength: 2, maxLength: 70 },
  description: { required: false, type: "string", maxLength: 255 },
  is_system: { required: false, type: "boolean" },
};

// ─── Bulk Schemas ─────────────────────────────────────────────────────────────

export const bulkCreateRoleSchema = {
  name: { required: true, type: "string", minLength: 2, maxLength: 70 },
  display_name: { required: true, type: "string", minLength: 2, maxLength: 70 },
  description: { required: false, type: "string", maxLength: 255 },
  is_system: { required: false, type: "boolean" },
};

export const bulkUpdateRoleSchema = {
  id: { required: true, type: "number" },
  name: { required: false, type: "string", minLength: 2, maxLength: 70 },
  display_name: { required: true, type: "string", minLength: 2, maxLength: 70 },
  description: { required: false, type: "string", maxLength: 255 },
  is_system: { required: false, type: "boolean" },
};
