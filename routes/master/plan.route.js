import { Router } from "express";
import * as PlanController from "../../controllers/master/plan.controller.js";
import * as PlanFeatureController from "../../controllers/master/planFeature.controller.js";
import * as PlanLimitController from "../../controllers/master/planLimit.controller.js";
import {
  authenticate,
  requireMasterContext,
} from "../../middlewares/auth.middleware.js";
import { validate, validateBulk } from "../../validators/index.js";
import {
  createPlanSchema,
  updatePlanSchema,
  addLimitSchema,
  updateLimitSchema,
  assignFeatureSchema,
  toggleFeatureSchema,
  bulkCreatePlanSchema,
  bulkUpdatePlanSchema,
  bulkAssignFeaturesSchema,
  bulkAddLimitsSchema,
} from "../../validators/master/plan.validator.js";

const PlanRoutes = Router();

PlanRoutes.use(authenticate, requireMasterContext);

// ─── Single-Record Plan Routes ────────────────────────────────────────────────
PlanRoutes.get("/get-all-plans", PlanController.getAllPlans);
PlanRoutes.get("/get-plan-by-id/:id", PlanController.getPlanById);
PlanRoutes.post("/create-plan", validate(createPlanSchema), PlanController.createPlan);
PlanRoutes.patch("/update-plan/:id", validate(updatePlanSchema), PlanController.updatePlan);
PlanRoutes.delete("/delete-plan/:id", PlanController.deletePlan);

// ─── Bulk Plan Routes ─────────────────────────────────────────────────────────
// POST   /master/plans/bulk-create    { items: [...] }
// PATCH  /master/plans/bulk-update    { items: [{id, ...}, ...] }
// DELETE /master/plans/bulk-delete    { ids: [...] }
PlanRoutes.post("/bulk-create", validateBulk(bulkCreatePlanSchema), PlanController.bulkCreatePlans);
PlanRoutes.patch("/bulk-update", validateBulk(bulkUpdatePlanSchema), PlanController.bulkUpdatePlans);
PlanRoutes.delete("/bulk-delete", validateBulk(null, { mode: "ids" }), PlanController.bulkDeletePlans);

// ─── Single-Record Plan Feature Routes ───────────────────────────────────────
PlanRoutes.get("/get-plan-features/:planId", PlanFeatureController.getFeaturesByPlan);
PlanRoutes.post(
  "/assign-plan-feature/:planId",
  validate(assignFeatureSchema),
  PlanFeatureController.assignFeature,
);
PlanRoutes.patch(
  "/toggle-plan-feature/:planId/:featureId",
  validate(toggleFeatureSchema),
  PlanFeatureController.toggleFeature,
);
PlanRoutes.delete("/remove-plan-feature/:planId/:featureId", PlanFeatureController.removeFeature);

// ─── Bulk Plan Feature Routes ─────────────────────────────────────────────────
// POST   /master/plans/:planId/bulk-assign-features   { items: [{feature_id, is_active?}, ...] }
// DELETE /master/plans/:planId/bulk-remove-features   { ids: [...] }
PlanRoutes.post(
  "/bulk-assign-features/:planId",
  validateBulk(bulkAssignFeaturesSchema),
  PlanFeatureController.bulkAssignFeatures,
);
PlanRoutes.delete(
  "/bulk-remove-features/:planId",
  validateBulk(null, { mode: "ids" }),
  PlanFeatureController.bulkRemoveFeatures,
);

// ─── Single-Record Plan Limit Routes ─────────────────────────────────────────
PlanRoutes.get("/get-plan-limits/:planId", PlanLimitController.getLimitsByPlan);
PlanRoutes.post("/add-plan-limit/:planId", validate(addLimitSchema), PlanLimitController.addLimit);
PlanRoutes.patch(
  "/update-plan-limit/:planId/:limitId",
  validate(updateLimitSchema),
  PlanLimitController.updateLimit,
);
PlanRoutes.delete("/delete-plan-limit/:planId/:limitId", PlanLimitController.deleteLimit);

// ─── Bulk Plan Limit Routes ───────────────────────────────────────────────────
// POST   /master/plans/:planId/bulk-add-limits      { items: [{limit_key, limit_value}, ...] }
// DELETE /master/plans/:planId/bulk-delete-limits   { ids: [...] }
PlanRoutes.post(
  "/bulk-add-limits/:planId",
  validateBulk(bulkAddLimitsSchema),
  PlanLimitController.bulkAddLimits,
);
PlanRoutes.delete(
  "/bulk-delete-limits/:planId",
  validateBulk(null, { mode: "ids" }),
  PlanLimitController.bulkDeleteLimits,
);

export default PlanRoutes;
