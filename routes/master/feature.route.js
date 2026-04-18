import { Router } from "express";
import * as FeatureController from "../../controllers/master/feature.controller.js";
import {
  authenticate,
  requireMasterContext,
} from "../../middlewares/auth.middleware.js";
import { validate, validateBulk } from "../../validators/index.js";
import {
  createFeatureSchema,
  updateFeatureSchema,
  bulkCreateFeatureSchema,
  bulkUpdateFeatureSchema,
} from "../../validators/master/feature.validator.js";

const FeatureRoutes = Router();

FeatureRoutes.use(authenticate, requireMasterContext);

// ─── Single-Record Routes ─────────────────────────────────────────────────────
// GET    /master/features/get-all-features
// GET    /master/features/get-feature-by-id/:id
// POST   /master/features/create-feature
// PATCH  /master/features/update-feature/:id
// DELETE /master/features/delete-feature/:id

FeatureRoutes.get("/get-all-features", FeatureController.getAllFeatures);
FeatureRoutes.get("/get-feature-by-id/:id", FeatureController.getFeatureById);
FeatureRoutes.post(
  "/create-feature",
  validate(createFeatureSchema),
  FeatureController.createFeature,
);
FeatureRoutes.patch(
  "/update-feature/:id",
  validate(updateFeatureSchema),
  FeatureController.updateFeature,
);
FeatureRoutes.delete("/delete-feature/:id", FeatureController.deleteFeature);

// ─── Bulk Routes ──────────────────────────────────────────────────────────────
// POST   /master/features/bulk-create   { items: [...] }
// PATCH  /master/features/bulk-update   { items: [{id, ...}, ...] }
// DELETE /master/features/bulk-delete   { ids: [...] }

FeatureRoutes.post(
  "/bulk-create",
  validateBulk(bulkCreateFeatureSchema),
  FeatureController.bulkCreateFeatures,
);
FeatureRoutes.patch(
  "/bulk-update",
  validateBulk(bulkUpdateFeatureSchema),
  FeatureController.bulkUpdateFeatures,
);
FeatureRoutes.delete(
  "/bulk-delete",
  validateBulk(null, { mode: "ids" }),
  FeatureController.bulkDeleteFeatures,
);

export default FeatureRoutes;
