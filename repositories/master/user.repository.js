import { Op } from "sequelize";
import { masterDb } from "../../models/index.js";

// ─── User Repository ──────────────────────────────────────────────────────────

export const getAllUsers = async (filters = {}) => {
  const { search, skip = 0, limit = 10, is_active, role_id } = filters;

  const where = { is_deleted: false };

  if (search) {
    where[Op.or] = [
      { first_name: { [Op.iLike]: `%${search}%` } },
      { last_name: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } },
    ];
  }

  // ✅ FIXED: coerce string "true"/"false" from query params to boolean
  if (is_active !== undefined) {
    where.is_active = is_active === "true" || is_active === true;
  }
  if (role_id) where.role_id = role_id;

  const { count, rows } = await masterDb.MasterUser.findAndCountAll({
    where,
    attributes: {
      exclude: [
        "password",
        "password_reset_token",
        "password_reset_expires_at",
      ],
    },
    offset: parseInt(skip),
    limit: parseInt(limit),
    order: [["created_at", "DESC"]], // ✅ FIXED: snake_case — models use underscored:true
    include: [
      {
        model: masterDb.MasterRole,
        as: "MasterRole", // ✅ FIXED: association defined with alias — must pass as
        attributes: ["id", "name"],
      },
    ],
  });

  return {
    data: rows,
    total: count,
    skip: parseInt(skip),
    limit: parseInt(limit),
  };
};

export const getUserById = async (id) => {
  return masterDb.MasterUser.findOne({
    where: { id, is_deleted: false },
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

export const getUserByEmail = async (email) => {
  return masterDb.MasterUser.findOne({
    where: { email: email.toLowerCase(), is_deleted: false },
  });
};

export const createUser = async (data) => {
  return masterDb.MasterUser.create(data);
};

export const updateUser = async (id, data) => {
  await masterDb.MasterUser.update(data, { where: { id } });
  return getUserById(id);
};

export const deleteUser = async (id) => {
  await masterDb.MasterUser.update(
    { is_active: false, is_deleted: true },
    { where: { id } },
  );
  return getUserById(id);
};

export const hardDeleteUser = async (id) => {
  return masterDb.MasterUser.destroy({ where: { id } });
};
