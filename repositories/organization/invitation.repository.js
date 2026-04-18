import { Op } from "sequelize";
import { initTenantModels } from "../../models/index.js";
import { INVITATION_STATUS } from "../../constants/index.js";

// ─── Invitation Repository ────────────────────────────────────────────────────

export const getAllInvitations = async (schema, filters = {}) => {
  const tenantDb = initTenantModels(schema);
  const { skip = 0, limit = 10, status } = filters;

  const where = {};
  if (status) where.status = status;

  const { count, rows } = await tenantDb.Invitation.findAndCountAll({
    where,
    include: [
      {
        model: tenantDb.User,
        as: "invitedBy",
        attributes: ["id", "first_name", "last_name", "email"],
      },
    ],
    offset: parseInt(skip),
    limit: parseInt(limit),
    order: [["createdAt", "DESC"]],
  });

  return {
    data: rows,
    total: count,
    skip: parseInt(skip),
    limit: parseInt(limit),
  };
};

export const getInvitationById = async (schema, id) => {
  const tenantDb = initTenantModels(schema);
  return tenantDb.Invitation.findOne({ where: { id } });
};

export const getInvitationByToken = async (schema, token) => {
  const tenantDb = initTenantModels(schema);
  return tenantDb.Invitation.findOne({ where: { token } });
};

export const getPendingInvitationByEmail = async (schema, email) => {
  const tenantDb = initTenantModels(schema);
  return tenantDb.Invitation.findOne({
    where: {
      email: email.toLowerCase(),
      status: INVITATION_STATUS.PENDING,
      expires_at: { [Op.gt]: new Date() },
    },
  });
};

export const createInvitation = async (schema, data) => {
  const tenantDb = initTenantModels(schema);
  return tenantDb.Invitation.create(data);
};

export const updateInvitationStatus = async (
  schema,
  id,
  status,
  extra = {},
) => {
  const tenantDb = initTenantModels(schema);
  await tenantDb.Invitation.update({ status, ...extra }, { where: { id } });
  return getInvitationById(schema, id);
};

export const updateInvitationToken = async (schema, id, token, expires_at) => {
  const tenantDb = initTenantModels(schema);
  await tenantDb.Invitation.update(
    { token, expires_at, status: INVITATION_STATUS.PENDING },
    { where: { id } },
  );
  return getInvitationById(schema, id);
};

export const countPendingInvitations = async (schema) => {
  const tenantDb = initTenantModels(schema);
  return tenantDb.Invitation.count({
    where: {
      status: INVITATION_STATUS.PENDING,
      expires_at: { [Op.gt]: new Date() },
    },
  });
};
