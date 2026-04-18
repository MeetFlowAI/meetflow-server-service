import { Router } from "express";
import * as OrganizationController from "../../controllers/organization/org.controller.js";
import {
  authenticate,
  requireOrgContext,
  authorize,
} from "../../middlewares/auth.middleware.js";
import { USER_ROLES } from "../../constants/index.js";

const OrgRoutes = Router();

OrgRoutes.use(
  authenticate,
  requireOrgContext,
  authorize([
    USER_ROLES.ORGANIZATION.ORGANIZATION_SUPER_ADMIN,
    USER_ROLES.ORGANIZATION.ORGANIZATION_ADMIN,
  ]),
);

// GET  /organization/profile/get-org-profile
// POST /organization/profile/update-org-settings

OrgRoutes.get("/get-org-profile", OrganizationController.getOrgProfile);
OrgRoutes.patch(
  "/update-org-settings",
  OrganizationController.updateOrgSettings,
);

export default OrgRoutes;
