import { Router } from "express";
import * as RoleController from "../../controllers/organization/role.controller.js";
import {
  authenticate,
  requireOrgContext,
  authorize,
} from "../../middlewares/auth.middleware.js";
import { validate } from "../../validators/index.js";
import { USER_ROLES } from "../../constants/index.js";
import {
  createRoleSchema,
  updateRoleSchema,
} from "../../validators/organization/role.validator.js";

const RoleRoutes = Router();

RoleRoutes.use(
  authenticate,
  requireOrgContext,
  authorize([
    USER_ROLES.ORGANIZATION.ORGANIZATION_SUPER_ADMIN,
    USER_ROLES.ORGANIZATION.ORGANIZATION_ADMIN,
  ]),
);

// ─── Single-Record Routes ─────────────────────────────────────────────────────
// GET    /organization/roles/get-all-roles
// GET    /organization/roles/get-role-by-id/:id
// POST   /organization/roles/create-role
// PATCH  /organization/roles/update-role/:id
// DELETE /organization/roles/delete-role/:id

RoleRoutes.get("/get-all-roles", RoleController.getAllRoles);
RoleRoutes.get("/get-role-by-id/:id", RoleController.getRoleById);
RoleRoutes.post(
  "/create-role",
  validate(createRoleSchema),
  RoleController.createRole,
);
RoleRoutes.patch(
  "/update-role/:id",
  validate(updateRoleSchema),
  RoleController.updateRole,
);
RoleRoutes.delete("/delete-role/:id", RoleController.deleteRole);

export default RoleRoutes;
