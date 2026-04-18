import * as UserRepository from "../../repositories/organization/user.repository.js";
import * as RoleRepository from "../../repositories/organization/role.repository.js";
import { USER_ROLES } from "../../constants/index.js";

// ─── User Service ───────────────────────────────────────────────────────────

export const getAllUsers = async ({ tenantSchema, filters }) => {
  try {
    return await UserRepository.getAllUsers(tenantSchema, filters);
  } catch (err) {
    throw {
      statusCode: 500,
      message: "Failed to fetch Users",
      error: err.message,
    };
  }
};

export const getUserById = async ({ tenantSchema, userId }) => {
  try {
    if (!userId) throw new Error("User ID is required");
    const User = await UserRepository.getUserById(tenantSchema, userId);
    if (!User)
      throw Object.assign(new Error("User not found."), { statusCode: 404 });
    return User;
  } catch (err) {
    throw { statusCode: err.statusCode || 404, message: err.message };
  }
};

export const updateUserRole = async ({
  tenantSchema,
  userId,
  roleId,
  requestingUserId,
}) => {
  try {
    if (!userId) throw new Error("User ID is required");
    if (!roleId) throw new Error("Role ID is required");

    // Cannot change your own role
    if (parseInt(userId) === parseInt(requestingUserId)) {
      throw Object.assign(new Error("You cannot change your own role."), {
        statusCode: 400,
      });
    }

    const User = await UserRepository.getUserById(tenantSchema, userId);
    if (!User)
      throw Object.assign(new Error("User not found."), { statusCode: 404 });

    // Cannot demote the org super admin
    if (User.Role?.name === USER_ROLES.ORGANIZATION.ORGANIZATION_SUPER_ADMIN) {
      throw Object.assign(
        new Error("The organization super admin role cannot be changed."),
        { statusCode: 403 },
      );
    }

    const role = await RoleRepository.getRoleById(tenantSchema, roleId);
    if (!role)
      throw Object.assign(new Error("Role not found."), { statusCode: 404 });

    return await UserRepository.updateUserRole(tenantSchema, userId, roleId);
  } catch (err) {
    throw { statusCode: err.statusCode || 400, message: err.message };
  }
};

export const deactivateUser = async ({
  tenantSchema,
  userId,
  requestingUserId,
}) => {
  try {
    if (!userId) throw new Error("User ID is required");

    if (parseInt(userId) === parseInt(requestingUserId)) {
      throw Object.assign(
        new Error("You cannot deactivate your own account."),
        { statusCode: 400 },
      );
    }

    const User = await UserRepository.getUserById(tenantSchema, userId);
    if (!User)
      throw Object.assign(new Error("User not found."), { statusCode: 404 });

    if (User.Role?.name === USER_ROLES.ORGANIZATION.ORGANIZATION_SUPER_ADMIN) {
      throw Object.assign(
        new Error("The organization super admin cannot be deactivated."),
        { statusCode: 403 },
      );
    }

    return await UserRepository.deactivateUser(tenantSchema, userId);
  } catch (err) {
    throw { statusCode: err.statusCode || 400, message: err.message };
  }
};

export const activateUser = async ({ tenantSchema, userId }) => {
  try {
    if (!userId) throw new Error("User ID is required");
    const User = await UserRepository.getUserById(tenantSchema, userId);
    if (!User)
      throw Object.assign(new Error("User not found."), { statusCode: 404 });
    return await UserRepository.activateUser(tenantSchema, userId);
  } catch (err) {
    throw { statusCode: err.statusCode || 400, message: err.message };
  }
};

export const removeUser = async ({
  tenantSchema,
  userId,
  requestingUserId,
}) => {
  try {
    if (!userId) throw new Error("User ID is required");

    if (parseInt(userId) === parseInt(requestingUserId)) {
      throw Object.assign(new Error("You cannot remove yourself."), {
        statusCode: 400,
      });
    }

    const User = await UserRepository.getUserById(tenantSchema, userId);
    if (!User)
      throw Object.assign(new Error("User not found."), { statusCode: 404 });

    if (User.Role?.name === USER_ROLES.ORGANIZATION.ORGANIZATION_SUPER_ADMIN) {
      throw Object.assign(
        new Error("The organization super admin cannot be removed."),
        { statusCode: 403 },
      );
    }

    await UserRepository.removeUser(tenantSchema, userId);
    return { success: true };
  } catch (err) {
    throw { statusCode: err.statusCode || 400, message: err.message };
  }
};
