import { masterDb, initTenantModels } from "../../models/index.js";

// ─── Account Repository ───────────────────────────────────────────────────────

/**
 * Get master user profile by id (excludes sensitive fields)
 */
export const getMasterUserProfile = async (userId) => {
  return masterDb.MasterUser.findOne({
    where: { id: userId, is_deleted: false },
    attributes: {
      exclude: [
        "password",
        "password_reset_token",
        "password_reset_expires_at",
      ],
    },
    include: [
      {
        model: masterDb.MasterRole,
        as: "MasterRole", // ✅ FIXED: association defined with alias — must pass as
        attributes: ["id", "name"],
      },
    ],
  });
};

/**
 * Get org user profile by id in a given tenant schema (excludes sensitive fields)
 */
export const getOrgUserProfile = async (userId, schema) => {
  const tenantDb = initTenantModels(schema);
  return tenantDb.User.findOne({
    where: { id: userId, is_deleted: false },
    attributes: {
      exclude: [
        "password",
        "password_reset_token",
        "password_reset_expires_at",
      ],
    },
    include: [
      {
        model: tenantDb.Role,
        as: "Role", // ✅ FIXED: association defined with alias — must pass as
        attributes: ["id", "name"],
      },
    ],
  });
};

/**
 * Update master user profile fields
 */
export const updateMasterUserProfile = async (userId, data) => {
  await masterDb.MasterUser.update(data, { where: { id: userId } });
  return getMasterUserProfile(userId);
};

/**
 * Update org user profile fields in a given tenant schema
 */
export const updateOrgUserProfile = async (userId, data, schema) => {
  const tenantDb = initTenantModels(schema);
  await tenantDb.User.update(data, { where: { id: userId } });
  return getOrgUserProfile(userId, schema);
};

/**
 * Fetch master user password hash (for change-password verification)
 */
export const getMasterUserPassword = async (userId) => {
  return masterDb.MasterUser.findOne({
    where: { id: userId, is_deleted: false },
    attributes: ["id", "password"],
  });
};

/**
 * Fetch org user password hash (for change-password verification)
 */
export const getOrgUserPassword = async (userId, schema) => {
  const tenantDb = initTenantModels(schema);
  return tenantDb.User.findOne({
    where: { id: userId, is_deleted: false },
    attributes: ["id", "password"],
  });
};

/**
 * Update master user password
 */
export const updateMasterUserPassword = async (userId, hashedPassword) => {
  return masterDb.MasterUser.update(
    { password: hashedPassword },
    { where: { id: userId } },
  );
};

/**
 * Update org user password
 */
export const updateOrgUserPassword = async (userId, hashedPassword, schema) => {
  const tenantDb = initTenantModels(schema);
  return tenantDb.User.update(
    { password: hashedPassword },
    { where: { id: userId } },
  );
};
