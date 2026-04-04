/**
 * validators/master/organization.validator.js
 *
 * createOrganization maps to the 3-step UI:
 *  Step 1: name, display_name, domain, official_email, logo
 *  Step 2: owner_first_name, owner_last_name, primary_owner_email
 *  Step 3: plan_id, subscription_end_date
 *
 * All sent in one POST body. owner_password is NOT accepted —
 * the server auto-generates it and emails it to the owner.
 */

export const createOrganizationSchema = {
  // Step 1 — org identity
  name: { required: true, type: "string", minLength: 2, maxLength: 120 },
  display_name: {
    required: true,
    type: "string",
    minLength: 2,
    maxLength: 100,
  },
  domain: { required: true, type: "string", minLength: 3, maxLength: 100 },
  official_email: { required: true, type: "string", isEmail: true },
  logo: { required: false, type: "string" },
  // Step 2 — owner account
  owner_first_name: {
    required: true,
    type: "string",
    minLength: 1,
    maxLength: 50,
  },
  owner_last_name: {
    required: true,
    type: "string",
    minLength: 1,
    maxLength: 50,
  },
  primary_owner_email: { required: true, type: "string", isEmail: true },
  // Step 3 — plan selection (required)
  plan_id: { required: true, type: "number" },
};

export const updateOrganizationSchema = {
  name: { required: false, type: "string", minLength: 2, maxLength: 120 },
  display_name: {
    required: false,
    type: "string",
    minLength: 2,
    maxLength: 100,
  },
  logo: { required: false, type: "string" },
  domain: { required: false, type: "string", minLength: 3, maxLength: 100 },
  official_email: { required: false, type: "string", isEmail: true },
};

export const assignPlanSchema = {
  plan_id: { required: true, type: "number" },
};

// ─── Bulk Schemas ─────────────────────────────────────────────────────────────

/**
 * Bulk create — each item must satisfy createOrganizationSchema
 * (org schemas are provisioned sequentially to avoid DB overload)
 */
export const bulkCreateOrganizationSchema = {
  name: { required: true, type: "string", minLength: 2, maxLength: 120 },
  display_name: {
    required: true,
    type: "string",
    minLength: 2,
    maxLength: 100,
  },
  official_email: { required: true, type: "string", isEmail: true },
  primary_owner_email: { required: true, type: "string", isEmail: true },
  domain: { required: true, type: "string", minLength: 3, maxLength: 100 },
  logo: { required: false, type: "string" },
  plan_id: { required: false, type: "number" },
};

/**
 * Bulk update — each item must carry id + at least one updatable field
 */
export const bulkUpdateOrganizationSchema = {
  id: { required: true, type: "number" },
  name: { required: false, type: "string", minLength: 2, maxLength: 120 },
  display_name: {
    required: false,
    type: "string",
    minLength: 2,
    maxLength: 100,
  },
  logo: { required: false, type: "string" },
  domain: { required: false, type: "string", minLength: 3, maxLength: 100 },
};

/**
 * Bulk assign plan — each item: { id, plan_id }
 */
export const bulkAssignPlanSchema = {
  id: { required: true, type: "number" },
  plan_id: { required: true, type: "number" },
};
