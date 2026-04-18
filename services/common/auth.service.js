import {
  comparePassword,
  hashPassword,
  generatePasswordResetToken,
  hashResetToken,
} from "../../utils/password.util.js";
import { generateTokens, verifyRefreshToken } from "../../utils/token.util.js";
import { sendPasswordResetEmail } from "../../utils/email.util.js";
import * as AuthRepository from "../../repositories/common/auth.repository.js";
import { isFreeEmailDomain, extractDomain } from "../../utils/auth.util.js";
import { TOKEN_EXPIRY } from "../../constants/index.js";

/**
 * Resolve which user table to check and return the user + context.
 *
 * Resolution order:
 *  1. Free domain (gmail etc.) → check master_users only
 *  2. Corporate domain → lookup org by domain
 *     a. Org found     → check org tenant users table
 *     b. Org NOT found → fallback to master_users (future MeetFlow corporate domain)
 *
 * Returns:
 *  { user, userType: "master"|schema_name, tenantSchema: null|schema_name, org: null|org_row }
 */
const resolveUser = async (email) => {
  const domain = extractDomain(email);

  if (!domain) throw new Error("Invalid email address.");

  // ── PATH A: free/personal domain → always master ──────────────────────────
  if (isFreeEmailDomain(domain)) {
    const user = await AuthRepository.findMasterUserByEmail(email);
    return {
      user,
      userType: "master",
      tenantSchema: null,
      org: null,
    };
  }

  // ── PATH B: corporate/edu domain → try org first ──────────────────────────
  const org = await AuthRepository.findOrgByDomain(domain);

  if (org) {
    // Org registered with this domain — look up user in their tenant schema
    const user = await AuthRepository.findOrgUserByEmail(
      email,
      org.schema_name,
    );
    return {
      user,
      userType: org.schema_name,
      tenantSchema: org.schema_name,
      org,
    };
  }

  // ── PATH C: corporate domain but no org registered → fallback to master ───
  // (covers future @meetflow.tech domain for staff)
  const user = await AuthRepository.findMasterUserByEmail(email);
  return {
    user,
    userType: "master",
    tenantSchema: null,
    org: null,
  };
};

// ─── Login ────────────────────────────────────────────────────────────────────

/**
 * Unified login for both master users and org users.
 *
 * Input:  { email, password, rememberMe, ip, device_info }
 * Output: { accessToken, refreshToken, user: { id, first_name, last_name, email, role }, org }
 */
export const login = async ({
  email,
  password,
  rememberMe = false,
  ip,
  device_info,
}) => {
  const normalizedEmail = email.trim().toLowerCase();

  const { user, userType, tenantSchema, org } =
    await resolveUser(normalizedEmail);

  // Always return generic 401 — never reveal which table was checked
  if (!user) {
    throw Object.assign(new Error("Invalid credentials."), { statusCode: 401 });
  }

  if (!user.is_active) {
    throw Object.assign(new Error("Invalid credentials."), { statusCode: 401 });
  }

  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    throw Object.assign(new Error("Invalid credentials."), { statusCode: 401 });
  }

  // Build JWT payload
  const tokenPayload = {
    userId: user.id,
    userType, // "master" or schema_name
    tenantSchema, // null for master, schema_name for org
    role: user.MasterRole?.name || user.role?.name || null,
  };

  const { accessToken, refreshToken, refreshExpiresAt } = generateTokens(
    tokenPayload,
    rememberMe,
  );

  console.log("user is here:", user);

  // Persist refresh token
  await AuthRepository.storeRefreshToken({
    user_id: user.id,
    user_type: userType,
    tenant_schema: tenantSchema,
    token: refreshToken,
    expires_at: refreshExpiresAt,
    device_info,
    ip_address: ip,
  });

  // Update last_login
  if (tenantSchema) {
    await AuthRepository.updateOrgUserLastLogin(user.id, tenantSchema);
  } else {
    await AuthRepository.updateMasterUserLastLogin(user.id);
  }

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role: user.MasterRole?.name || user.role?.name || null,
      userType,
    },
    // Org context — frontend can use this to show org branding
    org: org
      ? {
          id: org.id,
          name: org.name,
          display_name: org.display_name,
          logo: org.logo,
          schema_name: org.schema_name,
        }
      : null,
  };
};

// ─── Logout ───────────────────────────────────────────────────────────────────

/**
 * Revoke the provided refresh token.
 * Input: { refreshToken }
 */
export const logout = async ({ refreshToken }) => {
  if (!refreshToken) {
    throw Object.assign(new Error("Refresh token is required."), {
      statusCode: 400,
    });
  }
  await AuthRepository.revokeRefreshToken(refreshToken);
  return { success: true };
};

// ─── Refresh token ────────────────────────────────────────────────────────────

/**
 * Issue a new access + refresh token pair, rotating the old refresh token.
 * Input: { refreshToken }
 */
export const refreshToken = async ({ refreshToken: incomingToken }) => {
  if (!incomingToken) {
    throw Object.assign(new Error("Refresh token is required."), {
      statusCode: 400,
    });
  }

  // 1. Verify JWT signature + expiry
  let decoded;
  try {
    decoded = verifyRefreshToken(incomingToken);
  } catch {
    throw Object.assign(new Error("Invalid or expired refresh token."), {
      statusCode: 401,
    });
  }

  // 2. Check DB record is still valid (not revoked)
  const tokenRecord = await AuthRepository.findRefreshToken(incomingToken);
  if (!tokenRecord) {
    throw Object.assign(new Error("Invalid or expired refresh token."), {
      statusCode: 401,
    });
  }

  // 3. Check DB-level expiry
  if (new Date(tokenRecord.expires_at) < new Date()) {
    await AuthRepository.revokeRefreshToken(incomingToken);
    throw Object.assign(
      new Error("Refresh token expired. Please log in again."),
      { statusCode: 401 },
    );
  }

  // 4. Rotate — revoke old, issue new
  await AuthRepository.revokeRefreshToken(incomingToken);

  const tokenPayload = {
    userId: decoded.userId,
    userType: decoded.userType,
    tenantSchema: decoded.tenantSchema,
    role: decoded.role,
  };

  const {
    accessToken,
    refreshToken: newRefreshToken,
    refreshExpiresAt,
  } = generateTokens(tokenPayload);

  await AuthRepository.storeRefreshToken({
    user_id: decoded.userId,
    user_type: decoded.userType,
    tenant_schema: decoded.tenantSchema,
    token: newRefreshToken,
    expires_at: refreshExpiresAt,
    device_info: tokenRecord.device_info,
    ip_address: tokenRecord.ip_address,
  });

  return { accessToken, refreshToken: newRefreshToken };
};

// ─── Forgot password ──────────────────────────────────────────────────────────

/**
 * Generate a reset token and email it to the user.
 * Works for both master and org users.
 * Input: { email }
 *
 * IMPORTANT: Always return success — never reveal whether the email exists.
 */
export const forgotPassword = async ({ email }) => {
  const normalizedEmail = email.trim().toLowerCase();

  const { user, tenantSchema } = await resolveUser(normalizedEmail);

  // If user not found — still return success (don't expose user existence)
  if (!user || !user.is_active) {
    return { success: true };
  }

  const { rawToken, hashedToken } = generatePasswordResetToken();
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY.RESET);

  if (tenantSchema) {
    await AuthRepository.setOrgUserResetToken(
      user.id,
      hashedToken,
      expiresAt,
      tenantSchema,
    );
  } else {
    await AuthRepository.setMasterUserResetToken(
      user.id,
      hashedToken,
      expiresAt,
    );
  }

  // Send email — tenantSchema passed so the reset link includes ?schema= param
  await sendPasswordResetEmail(
    normalizedEmail,
    user.first_name,
    rawToken,
    tenantSchema,
  );

  return { success: true };
};

// ─── Reset password ───────────────────────────────────────────────────────────

/**
 * Validate reset token and update password.
 * Input: { token, newPassword, tenantSchema (optional — from query param for org users) }
 */
export const resetPassword = async ({
  token,
  newPassword,
  tenantSchema = null,
}) => {
  if (!token || !newPassword) {
    throw Object.assign(new Error("Token and new password are required."), {
      statusCode: 400,
    });
  }

  if (newPassword.length < 8) {
    throw Object.assign(new Error("Password must be at least 8 characters."), {
      statusCode: 400,
    });
  }

  const hashedToken = hashResetToken(token);

  let user;

  if (tenantSchema) {
    user = await AuthRepository.findOrgUserByResetToken(
      hashedToken,
      tenantSchema,
    );
  } else {
    user = await AuthRepository.findMasterUserByResetToken(hashedToken);
  }

  if (!user) {
    throw Object.assign(new Error("Reset token is invalid or has expired."), {
      statusCode: 400,
    });
  }

  const hashedPassword = await hashPassword(newPassword);

  if (tenantSchema) {
    await AuthRepository.updateOrgUserPassword(
      user.id,
      hashedPassword,
      tenantSchema,
    );
  } else {
    await AuthRepository.updateMasterUserPassword(user.id, hashedPassword);
  }

  // Revoke all existing refresh tokens on password change (security)
  const userType = tenantSchema || "master";
  await AuthRepository.revokeAllUserTokens(user.id, userType);

  return { success: true };
};
