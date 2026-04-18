import { Op } from "sequelize";
import { initTenantModels } from "../../models/index.js";
import { WORKSPACE_CHANNEL_TYPES } from "../../constants/index.js";

// ─── Channel Repository ───────────────────────────────────────────────────────

export const getChannelsByWorkspace = async (schema, workspaceId, filters = {}) => {
  const tenantDb = initTenantModels(schema);
  const { search, skip = 0, limit = 50, type } = filters;

  const where = { workspace_id: workspaceId };
  if (search) {
    where[Op.or] = [
      { name:        { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } },
    ];
  }
  if (type) where.type = type;

  const { count, rows } = await tenantDb.Channel.findAndCountAll({
    where,
    offset: parseInt(skip),
    limit: parseInt(limit),
    order: [["createdAt", "ASC"]],
  });

  return { data: rows, total: count, skip: parseInt(skip), limit: parseInt(limit) };
};

export const getChannelById = async (schema, channelId) => {
  const tenantDb = initTenantModels(schema);
  return tenantDb.Channel.findOne({ where: { id: channelId } });
};

export const getChannelByName = async (schema, workspaceId, name) => {
  const tenantDb = initTenantModels(schema);
  return tenantDb.Channel.findOne({ where: { workspace_id: workspaceId, name } });
};

export const createChannel = async (schema, data) => {
  const tenantDb = initTenantModels(schema);
  return tenantDb.Channel.create(data);
};

export const updateChannel = async (schema, channelId, data) => {
  const tenantDb = initTenantModels(schema);
  await tenantDb.Channel.update(data, { where: { id: channelId } });
  return getChannelById(schema, channelId);
};

export const deleteChannel = async (schema, channelId) => {
  const tenantDb = initTenantModels(schema);
  return tenantDb.Channel.destroy({ where: { id: channelId } });
};

export const countChannelsByWorkspace = async (schema, workspaceId) => {
  const tenantDb = initTenantModels(schema);
  return tenantDb.Channel.count({ where: { workspace_id: workspaceId } });
};

/**
 * Get all channels a user is a member of within a workspace.
 * Public channels: everyone can see them regardless of membership.
 * Private channels: only visible if the user is a member.
 */
export const getChannelsForUser = async (schema, workspaceId, userId) => {
  const tenantDb = initTenantModels(schema);

  // Public channels — visible to all workspace members
  const publicChannels = await tenantDb.Channel.findAll({
    where: {
      workspace_id: workspaceId,
      type: WORKSPACE_CHANNEL_TYPES.PUBLIC,
    },
    order: [["createdAt", "ASC"]],
  });

  // Private channels — only ones the user belongs to
  const privateChannels = await tenantDb.Channel.findAll({
    where: {
      workspace_id: workspaceId,
      type: WORKSPACE_CHANNEL_TYPES.PRIVATE,
    },
    include: [
      {
        model: tenantDb.User,
        where: { id: userId },
        attributes: [],
        through: { attributes: [] },
      },
    ],
    order: [["createdAt", "ASC"]],
  });

  return { publicChannels, privateChannels };
};
