export const createUserSchema = {
  first_name: { required: true, type: "string", minLength: 1, maxLength: 50 },
  last_name: { required: true, type: "string", minLength: 1, maxLength: 50 },
  email: { required: true, type: "string", isEmail: true },
  password: { required: true, type: "string", minLength: 8 },
  role_id: { required: true, type: "number" },
  is_active: { required: false, type: "boolean" },
};

export const updateUserSchema = {
  first_name: { required: false, type: "string", minLength: 1, maxLength: 50 },
  last_name: { required: false, type: "string", minLength: 1, maxLength: 50 },
  email: { required: false, type: "string", isEmail: true },
  role_id: { required: false, type: "number" },
  is_active: { required: false, type: "boolean" },
};

// ─── Bulk Schemas ─────────────────────────────────────────────────────────────

export const bulkCreateUserSchema = {
  first_name: { required: true, type: "string", minLength: 1, maxLength: 50 },
  last_name: { required: true, type: "string", minLength: 1, maxLength: 50 },
  email: { required: true, type: "string", isEmail: true },
  password: { required: true, type: "string", minLength: 8 },
  role_id: { required: true, type: "number" },
  is_active: { required: false, type: "boolean" },
};

export const bulkUpdateUserSchema = {
  id: { required: true, type: "number" },
  first_name: { required: false, type: "string", minLength: 1, maxLength: 50 },
  last_name: { required: false, type: "string", minLength: 1, maxLength: 50 },
  email: { required: false, type: "string", isEmail: true },
  role_id: { required: false, type: "number" },
  is_active: { required: false, type: "boolean" },
};
