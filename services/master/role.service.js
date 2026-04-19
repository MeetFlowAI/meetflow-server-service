import * as RoleRepository from "../../repositories/master/role.repository.js";

// ─── Role Service ────────────────────────────────────────────────────────────

export const getAllRoles = async (filters) => {
  try {
    return await RoleRepository.getAllRoles(filters);
  } catch (err) {
    throw {
      statusCode: 500,
      message: "Failed to fetch roles",
      error: err.message,
    };
  }
};

export const getRoleById = async (id) => {
  try {
    if (!id) throw new Error("Role ID is required");

    const role = await RoleRepository.getRoleById(id);
    if (!role) throw new Error("Role not found");

    return role;
  } catch (err) {
    throw {
      statusCode: err.statusCode || 404,
      message: err.message,
    };
  }
};

export const createRole = async (data) => {
  try {
    if (!data.name) throw new Error("Role name is required");

    return await RoleRepository.createRole(data);
  } catch (err) {
    throw {
      statusCode: 400,
      message: err.message,
    };
  }
};

export const updateRole = async (id, data) => {
  try {
    if (!id) throw new Error("Role ID is required");

    const role = await RoleRepository.getRoleById(id);
    if (!role) throw new Error("Role not found");

    return await RoleRepository.updateRole(id, data);
  } catch (err) {
    throw {
      statusCode: err.statusCode || 400,
      message: err.message,
    };
  }
};

export const deleteRole = async (id) => {
  try {
    if (!id) throw new Error("Role ID is required");

    const role = await RoleRepository.getRoleById(id);
    if (!role) throw new Error("Role not found");

    return await RoleRepository.deleteRole(id);
  } catch (err) {
    throw {
      statusCode: err.statusCode || 400,
      message: err.message,
    };
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

export const bulkCreateRoles = async (items) => {
  const succeeded = [];
  const failed = [];
  await Promise.allSettled(
    items.map(async (item) => {
      try {
        const result = await createRole(item);
        succeeded.push(result);
      } catch (err) {
        failed.push({ item, reason: err.message });
      }
    }),
  );
  return buildBulkResult(succeeded, failed);
};

export const bulkUpdateRoles = async (items) => {
  const succeeded = [];
  const failed = [];
  await Promise.allSettled(
    items.map(async ({ id, ...data }) => {
      try {
        const result = await updateRole(id, data);
        succeeded.push(result);
      } catch (err) {
        failed.push({ item: { id, ...data }, reason: err.message });
      }
    }),
  );
  return buildBulkResult(succeeded, failed);
};

export const bulkDeleteRoles = async (ids) => {
  const succeeded = [];
  const failed = [];
  await Promise.allSettled(
    ids.map(async (id) => {
      try {
        const result = await deleteRole(id);
        succeeded.push(result);
      } catch (err) {
        failed.push({ item: { id }, reason: err.message });
      }
    }),
  );
  return buildBulkResult(succeeded, failed);
};
