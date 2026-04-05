import { masterDb, initTenantModels } from "../../models/index.js";

// ─── Organisation lookup ──────────────────────────────────────────────────────

/**
 * Find active org by domain in master_tenant.
 * Returns org row (with schema_name) or null.
 */
export const findOrgByDomain = async (domain) => {
  return await masterDb.Organization.findOne({
    where: { domain: domain.toLowerCase(), is_active: true, is_deleted: false },
    attributes: [
      "id",
      "schema_name",
      "name",
      "display_name",
      "logo",
      "domain",
      "is_active",
    ],
  });
};

// ─── User lookups ─────────────────────────────────────────────────────────────

/**
 * Find master user by email (master_tenant.master_users)
 */
export const findMasterUserByEmail = async (email) => {
  return await masterDb.MasterUser.findOne({
    where: { email: email.toLowerCase(), is_deleted: false },
    include: [
      {
        model: masterDb.MasterRole,
        as: "MasterRole", // ✅ required — association defined with this alias
        attributes: ["id", "name"],
      },
    ],
  });
};

/**
 * Find org user by email in a given tenant schema
 */
export const findOrgUserByEmail = async (email, schema) => {
  const tenantDb = initTenantModels(schema);
  return await tenantDb.User.findOne({
    where: { email: email.toLowerCase(), is_deleted: false },
    include: [
      {
        model: tenantDb.Role,
        as: "Role", // ✅ required — association defined with this alias
        attributes: ["id", "name"],
      },
    ],
  });
};

/**
 * Find master user by id
 */
export const findMasterUserById = async (userId) => {
  return await masterDb.MasterUser.findOne({
    where: { id: userId, is_deleted: false },
    attributes: {
      exclude: [
        "password",
        "password_reset_token",
        "password_reset_expires_at",
      ],
    },
  });
};

/**
 * Find org user by id in a given tenant schema
 */
export const findOrgUserById = async (userId, schema) => {
  const tenantDb = initTenantModels(schema);
  return await tenantDb.User.findOne({
    where: { id: userId, is_deleted: false },
    attributes: {
      exclude: [
        "password",
        "password_reset_token",
        "password_reset_expires_at",
      ],
    },
  });
};

// ─── Refresh token ────────────────────────────────────────────────────────────

/**
 * Store a new refresh token in master_tenant.refresh_tokens
 * Works for both master and org users — differentiated by user_type
 */
export const storeRefreshToken = async ({
  user_id,
  user_type, // "master" | schema_name
  tenant_schema, // null for master, schema_name for org
  token,
  expires_at,
  device_info,
  ip_address,
}) => {
  return await masterDb.RefreshToken.create({
    user_id,
    user_type,
    tenant_schema,
    token,
    expires_at,
    device_info,
    ip_address,
    is_revoked: false,
  });
};

/**
 * Find a valid (non-revoked, non-expired) refresh token
 */
export const findRefreshToken = async (token) => {
  return await masterDb.RefreshToken.findOne({
    where: { token, is_revoked: false },
  });
};

/**
 * Revoke a specific refresh token
 */
export const revokeRefreshToken = async (token) => {
  return await masterDb.RefreshToken.update(
    { is_revoked: true, revoked_at: new Date() },
    { where: { token } },
  );
};

/**
 * Revoke all refresh tokens for a user (logout all devices)
 */
export const revokeAllUserTokens = async (userId, userType) => {
  return await masterDb.RefreshToken.update(
    { is_revoked: true, revoked_at: new Date() },
    { where: { user_id: userId, user_type: userType, is_revoked: false } },
  );
};

// ─── last_login update ────────────────────────────────────────────────────────

export const updateMasterUserLastLogin = async (userId) => {
  return await masterDb.MasterUser.update(
    { last_login: new Date() },
    { where: { id: userId } },
  );
};

export const updateOrgUserLastLogin = async (userId, schema) => {
  const tenantDb = initTenantModels(schema);
  return await tenantDb.User.update(
    { last_login: new Date() },
    { where: { id: userId } },
  );
};

// ─── Password reset ───────────────────────────────────────────────────────────

/**
 * Store hashed reset token + expiry on a master user
 */
export const setMasterUserResetToken = async (
  userId,
  hashedToken,
  expiresAt,
) => {
  return await masterDb.MasterUser.update(
    {
      password_reset_token: hashedToken,
      password_reset_expires_at: expiresAt,
    },
    { where: { id: userId } },
  );
};

/**
 * Store hashed reset token + expiry on an org user
 */
export const setOrgUserResetToken = async (
  userId,
  hashedToken,
  expiresAt,
  schema,
) => {
  const tenantDb = initTenantModels(schema);
  return await tenantDb.User.update(
    {
      password_reset_token: hashedToken,
      password_reset_expires_at: expiresAt,
    },
    { where: { id: userId } },
  );
};

/**
 * Find master user by reset token (raw token — hashing done in service)
 */
export const findMasterUserByResetToken = async (hashedToken) => {
  const { Op } = await import("sequelize");
  return await masterDb.MasterUser.findOne({
    where: {
      password_reset_token: hashedToken,
      password_reset_expires_at: { [Op.gt]: new Date() },
      is_deleted: false,
    },
  });
};

/**
 * Find org user by reset token in a given schema
 */
export const findOrgUserByResetToken = async (hashedToken, schema) => {
  const { Op } = await import("sequelize");
  const tenantDb = initTenantModels(schema);
  return await tenantDb.User.findOne({
    where: {
      password_reset_token: hashedToken,
      password_reset_expires_at: { [Op.gt]: new Date() },
      is_deleted: false,
    },
  });
};

/**
 * Update master user's password and clear reset token fields
 */
export const updateMasterUserPassword = async (userId, hashedPassword) => {
  return await masterDb.MasterUser.update(
    {
      password: hashedPassword,
      password_reset_token: null,
      password_reset_expires_at: null,
    },
    { where: { id: userId } },
  );
};

/**
 * Update org user's password and clear reset token fields
 */
export const updateOrgUserPassword = async (userId, hashedPassword, schema) => {
  const tenantDb = initTenantModels(schema);
  return await tenantDb.User.update(
    {
      password: hashedPassword,
      password_reset_token: null,
      password_reset_expires_at: null,
    },
    { where: { id: userId } },
  );
};
