import { Router } from "express";
import * as WorkspaceController from "../../controllers/workspace/workspace.controller.js";
import {
  authenticate,
  requireOrgContext,
  authorize,
} from "../../middlewares/auth.middleware.js";
import { validate } from "../../validators/index.js";
import { USER_ROLES } from "../../constants/index.js";
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
} from "../../validators/workspace/workspace.validator.js";

const WorkRoutes = Router();

// All workspace routes require org auth
WorkRoutes.use(authenticate, requireOrgContext);

// GET /workspace/workspaces/my-workspaces — any org member (auth only, no role restriction)
WorkRoutes.get("/my-workspaces", WorkspaceController.getMyWorkspaces);

// Admin-only routes
WorkRoutes.use(
  authorize([
    USER_ROLES.ORGANIZATION.ORGANIZATION_SUPER_ADMIN,
    USER_ROLES.ORGANIZATION.ORGANIZATION_ADMIN,
  ]),
);

// ─── Single-Record Routes ─────────────────────────────────────────────────────
// GET    /workspace/workspaces/get-all-workspaces
// GET    /workspace/workspaces/get-workspace-by-id/:id
// POST   /workspace/workspaces/create-workspace
// PATCH  /workspace/workspaces/update-workspace/:id
// DELETE /workspace/workspaces/delete-workspace/:id

WorkRoutes.get("/get-all-workspaces", WorkspaceController.getAllWorkspaces);
WorkRoutes.get(
  "/get-workspace-by-id/:id",
  WorkspaceController.getWorkspaceById,
);
WorkRoutes.post(
  "/create-workspace",
  validate(createWorkspaceSchema),
  WorkspaceController.createWorkspace,
);
WorkRoutes.patch(
  "/update-workspace/:id",
  validate(updateWorkspaceSchema),
  WorkspaceController.updateWorkspace,
);
WorkRoutes.delete("/delete-workspace/:id", WorkspaceController.deleteWorkspace);

export default WorkRoutes;
