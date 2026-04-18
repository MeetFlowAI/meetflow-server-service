import { initTenantModels } from "../../models/index.js";

// ─── Channel Member Repository ────────────────────────────────────────────────

export const getChannelMembers = async (schema, channelId, filters = {}) => {
  const tenantDb = initTenantModels(schema);
  const { skip = 0, limit = 100 } = filters;

  const { count, rows } = await tenantDb.ChannelMember.findAndCountAll({
    where: { channel_id: channelId },
    include: [
      {
        model: tenantDb.User,
        as: "channelUser",
        attributes: ["id", "first_name", "last_name", "email"],
      },
    ],
    offset: parseInt(skip),
    limit: parseInt(limit),
    order: [["createdAt", "ASC"]],
  });

  return {
    data: rows,
    total: count,
    skip: parseInt(skip),
    limit: parseInt(limit),
  };
};

export const getChannelMember = async (schema, channelId, userId) => {
  const tenantDb = initTenantModels(schema);
  return tenantDb.ChannelMember.findOne({
    where: { channel_id: channelId, user_id: userId },
  });
};

export const addMemberToChannel = async (schema, channelId, userId) => {
  const tenantDb = initTenantModels(schema);
  return tenantDb.ChannelMember.create({
    channel_id: channelId,
    user_id: userId,
  });
};

export const removeMemberFromChannel = async (schema, channelId, userId) => {
  const tenantDb = initTenantModels(schema);
  return tenantDb.ChannelMember.destroy({
    where: { channel_id: channelId, user_id: userId },
  });
};

export const addMultipleMembersToChannel = async (
  schema,
  channelId,
  userIds,
) => {
  const tenantDb = initTenantModels(schema);
  const records = userIds.map((uid) => ({
    channel_id: channelId,
    user_id: uid,
  }));
  return tenantDb.ChannelMember.bulkCreate(records, { ignoreDuplicates: true });
};

export const countChannelMembers = async (schema, channelId) => {
  const tenantDb = initTenantModels(schema);
  return tenantDb.ChannelMember.count({ where: { channel_id: channelId } });
};
