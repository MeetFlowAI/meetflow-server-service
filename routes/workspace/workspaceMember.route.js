import { Router } from "express";
import * as WorkspaceMemberController from "../../controllers/workspace/workspaceMember.controller.js";
import {
  authenticate,
  requireOrgContext,
  authorize,
} from "../../middlewares/auth.middleware.js";
import { validate } from "../../validators/index.js";
import { USER_ROLES } from "../../constants/index.js";
import {
  addWorkspaceMemberSchema,
  updateWorkspaceMemberRoleSchema,
} from "../../validators/workspace/workspaceMember.validator.js";

const WorkspaceMemberRoutes = Router({ mergeParams: true });

WorkspaceMemberRoutes.use(authenticate, requireOrgContext);

// ── GET /me — returns current user's membership + voice_enrolled status ────────
// Used by WorkspaceHome to decide whether to show enrollment banner.
// Must be registered BEFORE any middleware that restricts by role.
WorkspaceMemberRoutes.get("/me", WorkspaceMemberController.getMyMembership);

// ─── Single-Record Routes ─────────────────────────────────────────────────────
// GET    /workspace/:workspaceId/members/get-all-members
// POST   /workspace/:workspaceId/members/add-member
// PATCH  /workspace/:workspaceId/members/update-member/:userId
// DELETE /workspace/:workspaceId/members/remove-member/:userId

WorkspaceMemberRoutes.get(
  "/get-all-members",
  WorkspaceMemberController.getWorkspaceMembers,
);
WorkspaceMemberRoutes.post(
  "/add-member",
  validate(addWorkspaceMemberSchema),
  WorkspaceMemberController.addMember,
);
WorkspaceMemberRoutes.patch(
  "/update-member/:userId",
  validate(updateWorkspaceMemberRoleSchema),
  WorkspaceMemberController.updateMemberRole,
);
WorkspaceMemberRoutes.delete(
  "/remove-member/:userId",
  WorkspaceMemberController.removeMember,
);

export default WorkspaceMemberRoutes;
