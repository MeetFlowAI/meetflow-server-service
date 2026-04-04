import { Op } from "sequelize";
import { masterDb } from "../../models/index.js";

// ─── Organization Repository ──────────────────────────────────────────────────

export const getAllOrganizations = async (filters = {}) => {
  const {
    search,
    skip = 0,
    limit = 10,
    is_active,
    subscription_status,
    plan_id,
  } = filters;

  const where = { isDeleted: false }; // ✅ Organization model HAS isDeleted — keep it

  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { domain: { [Op.iLike]: `%${search}%` } },
      { display_name: { [Op.iLike]: `%${search}%` } },
    ];
  }

  // ✅ FIXED: coerce string "true"/"false" from query params to boolean
  if (is_active !== undefined) {
    where.is_active = is_active === "true" || is_active === true;
  }
  if (subscription_status) where.subscription_status = subscription_status;
  if (plan_id) where.plan_id = plan_id;

  const { count, rows } = await masterDb.Organization.findAndCountAll({
    where,
    // ✅ Plan association has NO alias — include without 'as' is correct here
    include: [
      {
        model: masterDb.Plan,
        attributes: ["id", "name", "billing_cycle", "price"],
      },
    ],
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

export const getOrganizationById = async (id) => {
  return masterDb.Organization.findOne({
    where: { id, isDeleted: false },
    include: [
      {
        model: masterDb.Plan,
        attributes: ["id", "name", "billing_cycle", "price"],
      },
    ],
  });
};

export const getOrganizationByDomain = async (domain) => {
  return masterDb.Organization.findOne({
    where: { domain: domain.toLowerCase(), isDeleted: false },
  });
};

export const createOrganization = async (data) => {
  return masterDb.Organization.create(data);
};

export const updateOrganization = async (id, data) => {
  await masterDb.Organization.update(data, { where: { id } });
  return getOrganizationById(id);
};

export const activateOrganization = async (id) => {
  await masterDb.Organization.update({ is_active: true }, { where: { id } });
  return getOrganizationById(id);
};

export const deactivateOrganization = async (id) => {
  await masterDb.Organization.update({ is_active: false }, { where: { id } });
  return getOrganizationById(id);
};

export const deleteOrganization = async (id) => {
  await masterDb.Organization.update(
    { is_active: false, isDeleted: true },
    { where: { id } },
  );
  return getOrganizationById(id);
};

export const hardDeleteOrganization = async (id) => {
  return masterDb.Organization.destroy({ where: { id } });
};
