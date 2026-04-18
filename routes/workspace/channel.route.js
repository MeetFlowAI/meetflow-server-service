import { Router } from "express";
import * as ChannelController from "../../controllers/workspace/channel.controller.js";
import {
  authenticate,
  requireOrgContext,
  authorize,
} from "../../middlewares/auth.middleware.js";
import { validate } from "../../validators/index.js";
import { USER_ROLES } from "../../constants/index.js";
import {
  createChannelSchema,
  updateChannelSchema,
} from "../../validators/workspace/channel.validator.js";

const ChannelRoutes = Router({ mergeParams: true });

ChannelRoutes.use(authenticate, requireOrgContext);

// ─── Single-Record Routes ─────────────────────────────────────────────────────
// GET    /workspace/:workspaceId/channels/get-all-channels
// GET    /workspace/:workspaceId/channels/get-channel-by-id/:channelId
// POST   /workspace/:workspaceId/channels/create-channel
// PATCH  /workspace/:workspaceId/channels/update-channel/:channelId
// DELETE /workspace/:workspaceId/channels/delete-channel/:channelId

ChannelRoutes.get("/get-all-channels", ChannelController.getChannelsForUser);
ChannelRoutes.get(
  "/get-channel-by-id/:channelId",
  ChannelController.getChannelById,
);
ChannelRoutes.post(
  "/create-channel",
  validate(createChannelSchema),
  ChannelController.createChannel,
);
ChannelRoutes.patch(
  "/update-channel/:channelId",
  validate(updateChannelSchema),
  ChannelController.updateChannel,
);
ChannelRoutes.delete(
  "/delete-channel/:channelId",
  ChannelController.deleteChannel,
);

export default ChannelRoutes;
