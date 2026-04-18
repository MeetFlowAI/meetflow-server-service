import { Router } from "express";
import * as OrgController from "../../controllers/master/organization.controller.js";
import {
  authenticate,
  requireMasterContext,
} from "../../middlewares/auth.middleware.js";
import { validate, validateBulk } from "../../validators/index.js";
import {
  createOrganizationSchema,
  updateOrganizationSchema,
  assignPlanSchema,
  bulkCreateOrganizationSchema,
  bulkUpdateOrganizationSchema,
  bulkAssignPlanSchema,
} from "../../validators/master/organization.validator.js";

const OrganizationRoutes = Router();

OrganizationRoutes.use(authenticate, requireMasterContext);

// ─── Single-Record Routes ─────────────────────────────────────────────────────
// GET    /master/organizations/get-all-organizations
// GET    /master/organizations/get-organization-by-id/:id
// POST   /master/organizations/create-organization
// PATCH  /master/organizations/update-organization/:id
// PATCH  /master/organizations/activate-organization/:id
// PATCH  /master/organizations/deactivate-organization/:id
// PATCH  /master/organizations/assign-plan-to-organization/:id
// DELETE /master/organizations/delete-organization/:id

OrganizationRoutes.get("/get-all-organizations", OrgController.getAllOrganizations);
OrganizationRoutes.get("/get-organization-by-id/:id", OrgController.getOrganizationById);
OrganizationRoutes.post(
  "/create-organization",
  validate(createOrganizationSchema),
  OrgController.createOrganization,
);
OrganizationRoutes.patch(
  "/update-organization/:id",
  validate(updateOrganizationSchema),
  OrgController.updateOrganization,
);
OrganizationRoutes.patch("/activate-organization/:id", OrgController.activateOrganization);
OrganizationRoutes.patch("/deactivate-organization/:id", OrgController.deactivateOrganization);
OrganizationRoutes.patch(
  "/assign-plan-to-organization/:id",
  validate(assignPlanSchema),
  OrgController.assignPlan,
);
OrganizationRoutes.delete("/delete-organization/:id", OrgController.deleteOrganization);

// ─── Bulk Routes ──────────────────────────────────────────────────────────────
// POST   /master/organizations/bulk-create           { items: [...] }
// PATCH  /master/organizations/bulk-update           { items: [{id, ...}, ...] }
// DELETE /master/organizations/bulk-delete           { ids: [...] }
// PATCH  /master/organizations/bulk-activate         { ids: [...] }
// PATCH  /master/organizations/bulk-deactivate       { ids: [...] }
// PATCH  /master/organizations/bulk-assign-plan      { items: [{id, plan_id}, ...] }

OrganizationRoutes.post(
  "/bulk-create",
  validateBulk(bulkCreateOrganizationSchema, { maxItems: 10 }), // lower cap — schema provisioning is heavy
  OrgController.bulkCreateOrganizations,
);
OrganizationRoutes.patch(
  "/bulk-update",
  validateBulk(bulkUpdateOrganizationSchema),
  OrgController.bulkUpdateOrganizations,
);
OrganizationRoutes.delete(
  "/bulk-delete",
  validateBulk(null, { mode: "ids" }),
  OrgController.bulkDeleteOrganizations,
);
OrganizationRoutes.patch(
  "/bulk-activate",
  validateBulk(null, { mode: "ids" }),
  OrgController.bulkActivateOrganizations,
);
OrganizationRoutes.patch(
  "/bulk-deactivate",
  validateBulk(null, { mode: "ids" }),
  OrgController.bulkDeactivateOrganizations,
);
OrganizationRoutes.patch(
  "/bulk-assign-plan",
  validateBulk(bulkAssignPlanSchema),
  OrgController.bulkAssignPlans,
);

export default OrganizationRoutes;
