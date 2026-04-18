import { Router } from "express";
import RoleRoutes from "./role.route.js";
import InvitationRoutes from "./invitation.route.js";
import UserRoutes from "./user.route.js";
import OrgRoutes from "./org.route.js";

const OrganizationRoutes = Router();

OrganizationRoutes.use("/roles", RoleRoutes);
OrganizationRoutes.use("/users", UserRoutes);
OrganizationRoutes.use("/invitations", InvitationRoutes);
OrganizationRoutes.use("/profile", OrgRoutes);

export default OrganizationRoutes;
