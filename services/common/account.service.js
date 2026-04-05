import { comparePassword, hashPassword } from "../../utils/password.util.js";
import * as AccountRepository from "../../repositories/common/account.repository.js";

// ─── Get Profile ──────────────────────────────────────────────────────────────

/**
 * Return the authenticated user's profile.
 * Works for both master and org users.
 */
export const getProfile = async ({ userId, tenantSchema }) => {
  const user = tenantSchema
    ? await AccountRepository.getOrgUserProfile(userId, tenantSchema)
    : await AccountRepository.getMasterUserProfile(userId);

  if (!user) {
    throw Object.assign(new Error("User not found."), { statusCode: 404 });
  }

  return user;
};

// ─── Update Profile ───────────────────────────────────────────────────────────

/**
 * Update non-sensitive profile fields (first_name, last_name, etc.)
 */
export const updateProfile = async ({ userId, tenantSchema, data }) => {
  // Prevent sensitive fields from being updated via this endpoint
  const { password, role_id, is_active, is_deleted, ...safeData } = data;

  const updated = tenantSchema
    ? await AccountRepository.updateOrgUserProfile(
        userId,
        safeData,
        tenantSchema,
      )
    : await AccountRepository.updateMasterUserProfile(userId, safeData);

  if (!updated) {
    throw Object.assign(new Error("User not found."), { statusCode: 404 });
  }

  return updated;
};

// ─── Change Password ──────────────────────────────────────────────────────────

/**
 * Verify current password, then update to new password.
 */
export const changePassword = async ({
  userId,
  tenantSchema,
  currentPassword,
  newPassword,
}) => {
  if (!currentPassword || !newPassword) {
    throw Object.assign(
      new Error("Current password and new password are required."),
      { statusCode: 400 },
    );
  }

  if (newPassword.length < 8) {
    throw Object.assign(
      new Error("New password must be at least 8 characters."),
      { statusCode: 400 },
    );
  }

  // Fetch password hash
  const userRecord = tenantSchema
    ? await AccountRepository.getOrgUserPassword(userId, tenantSchema)
    : await AccountRepository.getMasterUserPassword(userId);

  if (!userRecord) {
    throw Object.assign(new Error("User not found."), { statusCode: 404 });
  }

  const isMatch = await comparePassword(currentPassword, userRecord.password);
  if (!isMatch) {
    throw Object.assign(new Error("Current password is incorrect."), {
      statusCode: 400,
    });
  }

  const hashedPassword = await hashPassword(newPassword);

  if (tenantSchema) {
    await AccountRepository.updateOrgUserPassword(
      userId,
      hashedPassword,
      tenantSchema,
    );
  } else {
    await AccountRepository.updateMasterUserPassword(userId, hashedPassword);
  }

  return { success: true };
};
