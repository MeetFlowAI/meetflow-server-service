import { Router } from "express";
import * as RoleController from "../../controllers/master/role.controller.js";
import {
  authenticate,
  requireMasterContext,
} from "../../middlewares/auth.middleware.js";
import { validate, validateBulk } from "../../validators/index.js";
import {
  createRoleSchema,
  updateRoleSchema,
  bulkCreateRoleSchema,
  bulkUpdateRoleSchema,
} from "../../validators/master/role.validator.js";

const RoleRoutes = Router();

RoleRoutes.use(authenticate, requireMasterContext);

// ─── Single-Record Routes ─────────────────────────────────────────────────────
// GET    /master/roles/get-all-roles
// GET    /master/roles/get-role-by-id/:id
// POST   /master/roles/create-role
// PATCH  /master/roles/update-role/:id
// DELETE /master/roles/delete-role/:id

RoleRoutes.get("/get-all-roles", RoleController.getAllRoles);
RoleRoutes.get("/get-role-by-id/:id", RoleController.getRoleById);
RoleRoutes.post("/create-role", validate(createRoleSchema), RoleController.createRole);
RoleRoutes.patch("/update-role/:id", validate(updateRoleSchema), RoleController.updateRole);
RoleRoutes.delete("/delete-role/:id", RoleController.deleteRole);

// ─── Bulk Routes ──────────────────────────────────────────────────────────────
// POST   /master/roles/bulk-create   { items: [...] }
// PATCH  /master/roles/bulk-update   { items: [{id, ...}, ...] }
// DELETE /master/roles/bulk-delete   { ids: [...] }

RoleRoutes.post(
  "/bulk-create",
  validateBulk(bulkCreateRoleSchema),
  RoleController.bulkCreateRoles,
);
RoleRoutes.patch(
  "/bulk-update",
  validateBulk(bulkUpdateRoleSchema),
  RoleController.bulkUpdateRoles,
);
RoleRoutes.delete(
  "/bulk-delete",
  validateBulk(null, { mode: "ids" }),
  RoleController.bulkDeleteRoles,
);

export default RoleRoutes;
