import { Op } from "sequelize";
import { masterDb } from "../../models/index.js";

// ─── Feature Repository ───────────────────────────────────────────────────────

export const getAllFeatures = async (filters = {}) => {
  const { search, skip = 0, limit = 10, is_active } = filters;

  // ✅ Feature model has no isDeleted field — removed that filter
  const where = {};

  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } },
      { feature_key: { [Op.iLike]: `%${search}%` } },
    ];
  }

  // ✅ FIXED: coerce string "true"/"false" from query params to boolean
  if (is_active !== undefined) {
    where.is_active = is_active === "true" || is_active === true;
  }

  const { count, rows } = await masterDb.Feature.findAndCountAll({
    where,
    offset: parseInt(skip),
    limit: parseInt(limit),
    order: [["createdAt", "DESC"]], // ✅ FIXED: camelCase — no underscored:true on model
  });

  return {
    data: rows,
    total: count,
    skip: parseInt(skip),
    limit: parseInt(limit),
  };
};

export const getFeatureById = async (id) => {
  // ✅ Feature model has no isDeleted field — removed that filter
  return masterDb.Feature.findOne({ where: { id } });
};

export const createFeature = async (data) => {
  return masterDb.Feature.create(data);
};

export const updateFeature = async (id, data) => {
  await masterDb.Feature.update(data, { where: { id } });
  return getFeatureById(id);
};

export const deleteFeature = async (id) => {
  // ✅ Feature model has no isDeleted field — only toggle is_active
  await masterDb.Feature.update({ is_active: false }, { where: { id } });
  return getFeatureById(id);
};

export const hardDeleteFeature = async (id) => {
  return masterDb.Feature.destroy({ where: { id } });
};
