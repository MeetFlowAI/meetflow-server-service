import * as ChannelRepository from "../../repositories/workspace/channel.repository.js";
import * as ChannelMemberRepository from "../../repositories/workspace/channelMember.repository.js";
import * as WorkspaceRepository from "../../repositories/workspace/workspace.repository.js";
import * as WorkspaceMemberRepository from "../../repositories/workspace/workspaceMember.repository.js";
import { masterDb } from "../../models/index.js";
import { USER_ROLES, WORKSPACE_CHANNEL_TYPES } from "../../constants/index.js";

// ─── Plan limit enforcement ───────────────────────────────────────────────────
const enforceChannelLimit = async (tenantSchema, workspaceId) => {
  const org = await masterDb.Organization.findOne({
    where: { schema_name: tenantSchema },
    attributes: ["plan_id"],
  });
  if (!org?.plan_id) return;

  const limit = await masterDb.PlanLimit.findOne({
    where: { plan_id: org.plan_id, limit_key: "max_channels_per_workspace" },
  });
  if (!limit || limit.limit_value === -1) return;

  const current = await ChannelRepository.countChannelsByWorkspace(
    tenantSchema,
    workspaceId,
  );
  if (current >= limit.limit_value) {
    throw Object.assign(
      new Error(
        `Your plan allows a maximum of ${limit.limit_value} channels per workspace. Upgrade to create more.`,
      ),
      { statusCode: 403 },
    );
  }
};

// ─── Channel Service ──────────────────────────────────────────────────────────

export const getChannelsForUser = async ({
  tenantSchema,
  workspaceId,
  userId,
}) => {
  try {
    const workspace = await WorkspaceRepository.getWorkspaceById(
      tenantSchema,
      workspaceId,
    );
    if (!workspace)
      throw Object.assign(new Error("Workspace not found."), {
        statusCode: 404,
      });

    const membership = await WorkspaceMemberRepository.getWorkspaceMember(
      tenantSchema,
      workspaceId,
      userId,
    );
    if (!membership)
      throw Object.assign(
        new Error("You are not a member of this workspace."),
        { statusCode: 403 },
      );

    return await ChannelRepository.getChannelsForUser(
      tenantSchema,
      workspaceId,
      userId,
    );
  } catch (err) {
    throw { statusCode: err.statusCode || 400, message: err.message };
  }
};

export const getAllChannels = async ({
  tenantSchema,
  workspaceId,
  filters,
}) => {
  try {
    const workspace = await WorkspaceRepository.getWorkspaceById(
      tenantSchema,
      workspaceId,
    );
    if (!workspace)
      throw Object.assign(new Error("Workspace not found."), {
        statusCode: 404,
      });
    return await ChannelRepository.getChannelsByWorkspace(
      tenantSchema,
      workspaceId,
      filters,
    );
  } catch (err) {
    throw { statusCode: err.statusCode || 500, message: err.message };
  }
};

export const getChannelById = async ({ tenantSchema, channelId, userId }) => {
  try {
    const channel = await ChannelRepository.getChannelById(
      tenantSchema,
      channelId,
    );
    if (!channel)
      throw Object.assign(new Error("Channel not found."), { statusCode: 404 });

    // For private channels, verify user is a member
    if (channel.type === WORKSPACE_CHANNEL_TYPES.PRIVATE) {
      const membership = await ChannelMemberRepository.getChannelMember(
        tenantSchema,
        channelId,
        userId,
      );
      if (!membership)
        throw Object.assign(
          new Error("You are not a member of this private channel."),
          { statusCode: 403 },
        );
    }

    return channel;
  } catch (err) {
    throw { statusCode: err.statusCode || 400, message: err.message };
  }
};

export const createChannel = async ({
  tenantSchema,
  workspaceId,
  data,
  creatorUserId,
}) => {
  try {
    if (!data.name?.trim()) throw new Error("Channel name is required");

    const workspace = await WorkspaceRepository.getWorkspaceById(
      tenantSchema,
      workspaceId,
    );
    if (!workspace)
      throw Object.assign(new Error("Workspace not found."), {
        statusCode: 404,
      });

    const membership = await WorkspaceMemberRepository.getWorkspaceMember(
      tenantSchema,
      workspaceId,
      creatorUserId,
    );
    if (!membership)
      throw Object.assign(
        new Error("You are not a member of this workspace."),
        { statusCode: 403 },
      );

    // Plan limit check
    await enforceChannelLimit(tenantSchema, workspaceId);

    // Name uniqueness per workspace
    const existing = await ChannelRepository.getChannelByName(
      tenantSchema,
      workspaceId,
      data.name.trim().toLowerCase(),
    );
    if (existing)
      throw Object.assign(
        new Error("A channel with this name already exists in this workspace."),
        { statusCode: 409 },
      );

    const channelType =
      data.type === WORKSPACE_CHANNEL_TYPES.PRIVATE
        ? WORKSPACE_CHANNEL_TYPES.PRIVATE
        : WORKSPACE_CHANNEL_TYPES.PUBLIC;

    const channel = await ChannelRepository.createChannel(tenantSchema, {
      name: data.name.trim().toLowerCase(), // channel names always lowercase like Slack
      description: data.description || null,
      workspace_id: workspaceId,
      type: channelType,
    });

    // Auto-add creator to the channel
    await ChannelMemberRepository.addMemberToChannel(
      tenantSchema,
      channel.id,
      creatorUserId,
    );

    // For private channels, also add any initial members passed in data.member_ids
    if (
      channelType === WORKSPACE_CHANNEL_TYPES.PRIVATE &&
      data.member_ids?.length
    ) {
      const otherMembers = data.member_ids.filter(
        (id) => parseInt(id) !== parseInt(creatorUserId),
      );
      if (otherMembers.length) {
        await ChannelMemberRepository.addMultipleMembersToChannel(
          tenantSchema,
          channel.id,
          otherMembers,
        );
      }
    }

    return channel;
  } catch (err) {
    throw { statusCode: err.statusCode || 400, message: err.message };
  }
};

export const updateChannel = async ({
  tenantSchema,
  channelId,
  data,
  userId,
}) => {
  try {
    const channel = await ChannelRepository.getChannelById(
      tenantSchema,
      channelId,
    );
    if (!channel)
      throw Object.assign(new Error("Channel not found."), { statusCode: 404 });

    // Only workspace owner/admin can update channels
    const wsMembership = await WorkspaceMemberRepository.getWorkspaceMember(
      tenantSchema,
      channel.workspace_id,
      userId,
    );
    if (
      !wsMembership ||
      wsMembership.role === USER_ROLES.WORKSPACE.WORKSPACE_MEMBER
    ) {
      throw Object.assign(
        new Error("Only workspace owners and admins can update channels."),
        { statusCode: 403 },
      );
    }

    const allowedFields = {};
    if (data.name) allowedFields.name = data.name.trim().toLowerCase();
    if (data.description !== undefined)
      allowedFields.description = data.description;

    return await ChannelRepository.updateChannel(
      tenantSchema,
      channelId,
      allowedFields,
    );
  } catch (err) {
    throw { statusCode: err.statusCode || 400, message: err.message };
  }
};

export const deleteChannel = async ({
  tenantSchema,
  channelId,
  userId,
  userOrgRole,
}) => {
  try {
    const channel = await ChannelRepository.getChannelById(
      tenantSchema,
      channelId,
    );
    if (!channel)
      throw Object.assign(new Error("Channel not found."), { statusCode: 404 });

    if (channel.name === "general") {
      throw Object.assign(
        new Error("The #general channel cannot be deleted."),
        { statusCode: 403 },
      );
    }

    const isOrgAdmin = [
      USER_ROLES.ORGANIZATION.ORGANIZATION_SUPER_ADMIN,
      USER_ROLES.ORGANIZATION.ORGANIZATION_ADMIN,
    ].includes(userOrgRole);

    const wsMembership = await WorkspaceMemberRepository.getWorkspaceMember(
      tenantSchema,
      channel.workspace_id,
      userId,
    );
    const isWsAdmin =
      wsMembership?.role === USER_ROLES.WORKSPACE.WORKSPACE_OWNER ||
      wsMembership?.role === USER_ROLES.WORKSPACE.WORKSPACE_ADMIN;

    if (!isOrgAdmin && !isWsAdmin) {
      throw Object.assign(
        new Error("Only workspace admins or org admins can delete channels."),
        { statusCode: 403 },
      );
    }

    await ChannelRepository.deleteChannel(tenantSchema, channelId);
    return { success: true };
  } catch (err) {
    throw { statusCode: err.statusCode || 400, message: err.message };
  }
};
