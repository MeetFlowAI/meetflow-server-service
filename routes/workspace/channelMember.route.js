import { Router } from "express";
import * as ChannelMemberController from "../../controllers/workspace/channelMember.controller.js";
import {
  authenticate,
  requireOrgContext,
  authorize,
} from "../../middlewares/auth.middleware.js";
import { validate } from "../../validators/index.js";
import { USER_ROLES } from "../../constants/index.js";
import { addChannelMemberSchema } from "../../validators/workspace/channelMember.validator.js";

const ChannelMemberRoutes = Router({ mergeParams: true });

ChannelMemberRoutes.use(authenticate, requireOrgContext);

// ─── Single-Record Routes ─────────────────────────────────────────────────────
// GET    /workspace/:workspaceId/channels/:channelId/members/get-all-members
// POST   /workspace/:workspaceId/channels/:channelId/members/add-member
// DELETE /workspace/:workspaceId/channels/:channelId/members/remove-member/:userId
// POST   /workspace/:workspaceId/channels/:channelId/members/join-channel
// POST   /workspace/:workspaceId/channels/:channelId/members/leave-channel
// DELETE /workspace/:workspaceId/channels/:channelId/members/remove-member/:userId

ChannelMemberRoutes.get(
  "/get-all-members",
  ChannelMemberController.getChannelMembers,
);
ChannelMemberRoutes.post(
  "/add-member",
  validate(addChannelMemberSchema),
  ChannelMemberController.addMemberToChannel,
);
ChannelMemberRoutes.delete(
  "/remove-member/:userId",
  ChannelMemberController.removeMemberFromChannel,
);
ChannelMemberRoutes.post("/join-channel", ChannelMemberController.joinChannel);
ChannelMemberRoutes.post(
  "/leave-channel",
  ChannelMemberController.leaveChannel,
);

export default ChannelMemberRoutes;
