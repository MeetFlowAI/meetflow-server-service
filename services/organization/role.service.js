import * as RoleRepository from "../../repositories/organization/role.repository.js";

// ─── Org Role Service ─────────────────────────────────────────────────────────

export const getAllRoles = async ({ tenantSchema, filters }) => {
  try {
    return await RoleRepository.getAllRoles(tenantSchema, filters);
  } catch (err) {
    throw { statusCode: 500, message: "Failed to fetch roles", error: err.message };
  }
};

export const getRoleById = async ({ tenantSchema, roleId }) => {
  try {
    if (!roleId) throw new Error("Role ID is required");
    const role = await RoleRepository.getRoleById(tenantSchema, roleId);
    if (!role) throw Object.assign(new Error("Role not found."), { statusCode: 404 });
    return role;
  } catch (err) {
    throw { statusCode: err.statusCode || 404, message: err.message };
  }
};

export const createRole = async ({ tenantSchema, data }) => {
  try {
    if (!data.name) throw new Error("Role name is required");

    const existing = await RoleRepository.getRoleByName(tenantSchema, data.name.trim());
    if (existing) {
      throw Object.assign(new Error("A role with this name already exists."), { statusCode: 409 });
    }

    return await RoleRepository.createRole(tenantSchema, {
      name: data.name.trim(),
      description: data.description || null,
      is_system: false, // custom roles created by admins are never system roles
    });
  } catch (err) {
    throw { statusCode: err.statusCode || 400, message: err.message };
  }
};

export const updateRole = async ({ tenantSchema, roleId, data }) => {
  try {
    if (!roleId) throw new Error("Role ID is required");

    const role = await RoleRepository.getRoleById(tenantSchema, roleId);
    if (!role) throw Object.assign(new Error("Role not found."), { statusCode: 404 });

    // Prevent renaming system roles
    if (role.is_system) {
      throw Object.assign(
        new Error("System roles cannot be modified. Create a custom role instead."),
        { statusCode: 403 },
      );
    }

    if (data.name) {
      const existing = await RoleRepository.getRoleByName(tenantSchema, data.name.trim());
      if (existing && existing.id !== parseInt(roleId)) {
        throw Object.assign(
          new Error("A role with this name already exists."),
          { statusCode: 409 },
        );
      }
    }

    return await RoleRepository.updateRole(tenantSchema, roleId, {
      name: data.name?.trim(),
      description: data.description,
    });
  } catch (err) {
    throw { statusCode: err.statusCode || 400, message: err.message };
  }
};

export const deleteRole = async ({ tenantSchema, roleId }) => {
  try {
    if (!roleId) throw new Error("Role ID is required");

    const role = await RoleRepository.getRoleById(tenantSchema, roleId);
    if (!role) throw Object.assign(new Error("Role not found."), { statusCode: 404 });

    if (role.is_system) {
      throw Object.assign(
        new Error("System roles cannot be deleted."),
        { statusCode: 403 },
      );
    }

    await RoleRepository.deleteRole(tenantSchema, roleId);
    return { success: true };
  } catch (err) {
    throw { statusCode: err.statusCode || 400, message: err.message };
  }
};
