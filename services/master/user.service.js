import * as UserRepository from "../../repositories/master/user.repository.js";
import { hashPassword } from "../../utils/password.util.js";

// ─── User Service ─────────────────────────────────────────────────────────────

export const getAllUsers = async (filters) => {
  try {
    return await UserRepository.getAllUsers(filters);
  } catch (err) {
    throw {
      statusCode: 500,
      message: "Failed to fetch users",
      error: err.message,
    };
  }
};

export const getUserById = async (id) => {
  try {
    if (!id) throw new Error("User ID is required");
    const user = await UserRepository.getUserById(id);
    if (!user) throw new Error("User not found");
    return user;
  } catch (err) {
    throw { statusCode: err.statusCode || 404, message: err.message };
  }
};

export const createUser = async (data) => {
  try {
    // Fix 3: model has first_name/last_name — not a single 'name' field
    if (!data.first_name) throw new Error("First name is required");
    if (!data.last_name) throw new Error("Last name is required");
    if (!data.email) throw new Error("Email is required");
    if (!data.password) throw new Error("Password is required");
    if (!data.role_id) throw new Error("Role ID is required");

    const existingUser = await UserRepository.getUserByEmail(data.email);
    if (existingUser) throw new Error("Email already in use");

    // Fix 7: hash password before persisting
    const hashedPassword = await hashPassword(data.password);

    return await UserRepository.createUser({
      ...data,
      password: hashedPassword,
    });
  } catch (err) {
    throw { statusCode: 400, message: err.message };
  }
};

export const updateUser = async (id, data) => {
  try {
    if (!id) throw new Error("User ID is required");

    const user = await UserRepository.getUserById(id);
    if (!user) throw new Error("User not found");

    if (data.email && data.email !== user.email) {
      const existingUser = await UserRepository.getUserByEmail(data.email);
      if (existingUser) throw new Error("Email already in use");
    }

    // Fix 8: if caller passes a new password, hash it first — never store plain text
    if (data.password) {
      data = { ...data, password: await hashPassword(data.password) };
    }

    return await UserRepository.updateUser(id, data);
  } catch (err) {
    throw { statusCode: err.statusCode || 400, message: err.message };
  }
};

export const deleteUser = async (id) => {
  try {
    if (!id) throw new Error("User ID is required");
    const user = await UserRepository.getUserById(id);
    if (!user) throw new Error("User not found");
    return await UserRepository.deleteUser(id);
  } catch (err) {
    throw { statusCode: err.statusCode || 400, message: err.message };
  }
};

// ─── Bulk helpers ─────────────────────────────────────────────────────────────

const buildBulkResult = (succeeded, failed) => ({
  succeeded,
  failed,
  summary: {
    total: succeeded.length + failed.length,
    success: succeeded.length,
    failed: failed.length,
  },
});

// ─── Bulk Services ────────────────────────────────────────────────────────────

export const bulkCreateUsers = async (items) => {
  const succeeded = [];
  const failed = [];
  await Promise.allSettled(
    items.map(async (item) => {
      try {
        const result = await createUser(item);
        succeeded.push(result);
      } catch (err) {
        failed.push({
          item: { ...item, password: "[REDACTED]" },
          reason: err.message,
        });
      }
    }),
  );
  return buildBulkResult(succeeded, failed);
};

export const bulkUpdateUsers = async (items) => {
  const succeeded = [];
  const failed = [];
  await Promise.allSettled(
    items.map(async ({ id, ...data }) => {
      try {
        const result = await updateUser(id, data);
        succeeded.push(result);
      } catch (err) {
        const safeData = { ...data };
        if (safeData.password) safeData.password = "[REDACTED]";
        failed.push({ item: { id, ...safeData }, reason: err.message });
      }
    }),
  );
  return buildBulkResult(succeeded, failed);
};

export const bulkDeleteUsers = async (ids) => {
  const succeeded = [];
  const failed = [];
  await Promise.allSettled(
    ids.map(async (id) => {
      try {
        const result = await deleteUser(id);
        succeeded.push(result);
      } catch (err) {
        failed.push({ item: { id }, reason: err.message });
      }
    }),
  );
  return buildBulkResult(succeeded, failed);
};
