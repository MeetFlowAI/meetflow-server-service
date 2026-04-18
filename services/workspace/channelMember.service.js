import * as ChannelMemberRepository from "../../repositories/workspace/channelMember.repository.js";
import * as ChannelRepository from "../../repositories/workspace/channel.repository.js";
import * as WorkspaceMemberRepository from "../../repositories/workspace/workspaceMember.repository.js";
import { WORKSPACE_CHANNEL_TYPES } from "../../constants/index.js";

// ─── Channel Member Service ───────────────────────────────────────────────────

export const getChannelMembers = async ({
  tenantSchema,
  channelId,
  userId,
  filters,
}) => {
  try {
    const channel = await ChannelRepository.getChannelById(
      tenantSchema,
      channelId,
    );
    if (!channel)
      throw Object.assign(new Error("Channel not found."), { statusCode: 404 });

    // Private channel — only members can list members
    if (channel.type === WORKSPACE_CHANNEL_TYPES.PRIVATE) {
      const isMember = await ChannelMemberRepository.getChannelMember(
        tenantSchema,
        channelId,
        userId,
      );
      if (!isMember)
        throw Object.assign(
          new Error("You are not a member of this private channel."),
          { statusCode: 403 },
        );
    }

    return await ChannelMemberRepository.getChannelMembers(
      tenantSchema,
      channelId,
      filters,
    );
  } catch (err) {
    throw { statusCode: err.statusCode || 400, message: err.message };
  }
};

export const addMemberToChannel = async ({
  tenantSchema,
  channelId,
  userId,
  requestingUserId,
}) => {
  try {
    const channel = await ChannelRepository.getChannelById(
      tenantSchema,
      channelId,
    );
    if (!channel)
      throw Object.assign(new Error("Channel not found."), { statusCode: 404 });

    // User must be a workspace member
    const wsMembership = await WorkspaceMemberRepository.getWorkspaceMember(
      tenantSchema,
      channel.workspace_id,
      userId,
    );
    if (!wsMembership)
      throw Object.assign(new Error("User is not a member of the workspace."), {
        statusCode: 400,
      });

    const alreadyMember = await ChannelMemberRepository.getChannelMember(
      tenantSchema,
      channelId,
      userId,
    );
    if (alreadyMember)
      throw Object.assign(
        new Error("User is already a member of this channel."),
        { statusCode: 409 },
      );

    return await ChannelMemberRepository.addMemberToChannel(
      tenantSchema,
      channelId,
      userId,
    );
  } catch (err) {
    throw { statusCode: err.statusCode || 400, message: err.message };
  }
};

export const removeMemberFromChannel = async ({
  tenantSchema,
  channelId,
  userId,
  requestingUserId,
}) => {
  try {
    const channel = await ChannelRepository.getChannelById(
      tenantSchema,
      channelId,
    );
    if (!channel)
      throw Object.assign(new Error("Channel not found."), { statusCode: 404 });

    const membership = await ChannelMemberRepository.getChannelMember(
      tenantSchema,
      channelId,
      userId,
    );
    if (!membership)
      throw Object.assign(new Error("User is not a member of this channel."), {
        statusCode: 404,
      });

    await ChannelMemberRepository.removeMemberFromChannel(
      tenantSchema,
      channelId,
      userId,
    );
    return { success: true };
  } catch (err) {
    throw { statusCode: err.statusCode || 400, message: err.message };
  }
};

/**
 * A user joins a public channel themselves.
 */
export const joinChannel = async ({ tenantSchema, channelId, userId }) => {
  try {
    const channel = await ChannelRepository.getChannelById(
      tenantSchema,
      channelId,
    );
    if (!channel)
      throw Object.assign(new Error("Channel not found."), { statusCode: 404 });

    if (channel.type === WORKSPACE_CHANNEL_TYPES.PRIVATE) {
      throw Object.assign(
        new Error("Private channels can only be joined via an invitation."),
        { statusCode: 403 },
      );
    }

    // Must be a workspace member
    const wsMembership = await WorkspaceMemberRepository.getWorkspaceMember(
      tenantSchema,
      channel.workspace_id,
      userId,
    );
    if (!wsMembership)
      throw Object.assign(
        new Error("Join the workspace first before joining a channel."),
        { statusCode: 403 },
      );

    const alreadyMember = await ChannelMemberRepository.getChannelMember(
      tenantSchema,
      channelId,
      userId,
    );
    if (alreadyMember)
      throw Object.assign(
        new Error("You are already a member of this channel."),
        { statusCode: 409 },
      );

    return await ChannelMemberRepository.addMemberToChannel(
      tenantSchema,
      channelId,
      userId,
    );
  } catch (err) {
    throw { statusCode: err.statusCode || 400, message: err.message };
  }
};

/**
 * A user leaves a channel.
 */
export const leaveChannel = async ({ tenantSchema, channelId, userId }) => {
  try {
    const channel = await ChannelRepository.getChannelById(
      tenantSchema,
      channelId,
    );
    if (!channel)
      throw Object.assign(new Error("Channel not found."), { statusCode: 404 });

    if (channel.name === "general") {
      throw Object.assign(new Error("You cannot leave the #general channel."), {
        statusCode: 403,
      });
    }

    const membership = await ChannelMemberRepository.getChannelMember(
      tenantSchema,
      channelId,
      userId,
    );
    if (!membership)
      throw Object.assign(new Error("You are not a member of this channel."), {
        statusCode: 404,
      });

    await ChannelMemberRepository.removeMemberFromChannel(
      tenantSchema,
      channelId,
      userId,
    );
    return { success: true };
  } catch (err) {
    throw { statusCode: err.statusCode || 400, message: err.message };
  }
};
