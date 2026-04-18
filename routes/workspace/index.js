import { Router } from "express";
import WorkRoutes from "./workspace.route.js";
import WorkspaceMemberRoutes from "./workspaceMember.route.js";
import ChannelRoutes from "./channel.route.js";
import ChannelMemberRoutes from "./channelMember.route.js";
import MeetingRoutes from "./meeting.route.js";

const WorkspaceRoutes = Router();

WorkspaceRoutes.use("/workspaces", WorkRoutes);
WorkspaceRoutes.use("/:workspaceId/members", WorkspaceMemberRoutes);
WorkspaceRoutes.use("/:workspaceId/channels", ChannelRoutes);
WorkspaceRoutes.use(
  "/:workspaceId/channels/:channelId/members",
  ChannelMemberRoutes,
);
WorkspaceRoutes.use(
  "/:workspaceId/channels/:channelId/meetings",
  MeetingRoutes,
);

export default WorkspaceRoutes;
