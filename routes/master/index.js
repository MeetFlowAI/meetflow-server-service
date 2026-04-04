import { Router } from "express";
import RoleRoutes from "./role.route.js";
import UserRoutes from "./user.route.js";
import PlanRoutes from "./plan.route.js";
import FeatureRoutes from "./feature.route.js";
import OrganizationRoutes from "./organization.route.js";

const MasterRoutes = Router();

MasterRoutes.use("/roles", RoleRoutes);
MasterRoutes.use("/users", UserRoutes);
MasterRoutes.use("/plans", PlanRoutes);

MasterRoutes.use("/features", FeatureRoutes);
MasterRoutes.use("/organizations", OrganizationRoutes);

export default MasterRoutes;
