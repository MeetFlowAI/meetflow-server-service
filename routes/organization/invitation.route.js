import { Router } from "express";
import * as InvitationController from "../../controllers/organization/invitation.controller.js";
import {
  authenticate,
  requireOrgContext,
  authorize,
} from "../../middlewares/auth.middleware.js";
import { validate } from "../../validators/index.js";
import { USER_ROLES } from "../../constants/index.js";
import {
  sendInvitationSchema,
  acceptInvitationSchema,
} from "../../validators/organization/invitation.validator.js";

const InvitationRoutes = Router();

InvitationRoutes.post(
  "/accept-invitation",
  validate(acceptInvitationSchema),
  InvitationController.acceptInvitation,
);

InvitationRoutes.use(
  authenticate,
  requireOrgContext,
  authorize([
    USER_ROLES.ORGANIZATION.ORGANIZATION_SUPER_ADMIN,
    USER_ROLES.ORGANIZATION.ORGANIZATION_ADMIN,
  ]),
);

// ─── Single-Record Routes ─────────────────────────────────────────────────────
// GET    /organization/invitations/get-all-invitations
// GET    /organization/invitations/get-invitation-by-id/:id
// POST   /organization/invitations/send-invitation
// PATCH  /organization/invitations/resend-invitation/:id
// DELETE /organization/invitations/cancel-invitation/:id

InvitationRoutes.get(
  "/get-all-invitations",
  InvitationController.getAllInvitations,
);
// InvitationRoutes.get(
//   "/get-invitation-by-id/:id",
//   InvitationController.getInvitationById,
// );
InvitationRoutes.post(
  "/send-invitation",
  validate(sendInvitationSchema),
  InvitationController.sendInvitation,
);
InvitationRoutes.patch(
  "/resend-invitation/:id",
  InvitationController.resendInvitation,
);
InvitationRoutes.delete(
  "/cancel-invitation/:id",
  InvitationController.cancelInvitation,
);

export default InvitationRoutes;
