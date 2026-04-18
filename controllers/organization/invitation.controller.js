import * as InvitationService from "../../services/organization/invitation.service.js";
import { successResponse, errorResponse } from "../../utils/response.util.js";
import { STATUS_CODES, RESPONSE_MESSAGES } from "../../constants/response.js";
import { masterDb } from "../../models/index.js";

// ─── Invitation Controller ────────────────────────────────────────────────────

export const getAllInvitations = async (req, res) => {
  try {
    const result = await InvitationService.getAllInvitations({
      tenantSchema: req.user.tenantSchema,
      filters: req.query,
    });
    return successResponse(res, STATUS_CODES.OK, RESPONSE_MESSAGES.SUCCESS, "Invitations retrieved successfully", result);
  } catch (err) {
    return errorResponse(res, err.statusCode || STATUS_CODES.BAD_REQUEST, RESPONSE_MESSAGES.ERROR, err.message, err);
  }
};

export const sendInvitation = async (req, res) => {
  try {
    // Get org display name for the email
    const org = await masterDb.Organization.findOne({
      where: { schema_name: req.user.tenantSchema },
      attributes: ["display_name"],
    });

    const result = await InvitationService.sendInvitation({
      tenantSchema: req.user.tenantSchema,
      data: req.body,
      invitedById: req.user.userId,
      orgName: org?.display_name || "MeetFlow",
    });
    return successResponse(res, STATUS_CODES.CREATED, RESPONSE_MESSAGES.SUCCESS, "Invitation sent successfully", result);
  } catch (err) {
    return errorResponse(res, err.statusCode || STATUS_CODES.BAD_REQUEST, RESPONSE_MESSAGES.ERROR, err.message, err);
  }
};

export const resendInvitation = async (req, res) => {
  try {
    const org = await masterDb.Organization.findOne({
      where: { schema_name: req.user.tenantSchema },
      attributes: ["display_name"],
    });

    const result = await InvitationService.resendInvitation({
      tenantSchema: req.user.tenantSchema,
      invitationId: req.params.id,
      orgName: org?.display_name || "MeetFlow",
    });
    return successResponse(res, STATUS_CODES.OK, RESPONSE_MESSAGES.SUCCESS, "Invitation resent successfully", result);
  } catch (err) {
    return errorResponse(res, err.statusCode || STATUS_CODES.BAD_REQUEST, RESPONSE_MESSAGES.ERROR, err.message, err);
  }
};

export const cancelInvitation = async (req, res) => {
  try {
    const result = await InvitationService.cancelInvitation({
      tenantSchema: req.user.tenantSchema,
      invitationId: req.params.id,
    });
    return successResponse(res, STATUS_CODES.OK, RESPONSE_MESSAGES.SUCCESS, "Invitation cancelled successfully", result);
  } catch (err) {
    return errorResponse(res, err.statusCode || STATUS_CODES.BAD_REQUEST, RESPONSE_MESSAGES.ERROR, err.message, err);
  }
};

/**
 * Public endpoint — called when an invited user clicks the invite link.
 * No auth token required. Token in body acts as the credential.
 * tenantSchema comes from the ?schema= query param in the invite link.
 */
export const acceptInvitation = async (req, res) => {
  try {
    const { token, first_name, last_name, password, tenant_schema } = req.body;

    const result = await InvitationService.acceptInvitationWithSchema({
      tenantSchema: tenant_schema,
      token,
      firstName: first_name,
      lastName: last_name,
      password,
    });
    return successResponse(
      res,
      STATUS_CODES.CREATED,
      RESPONSE_MESSAGES.SUCCESS,
      "Invitation accepted. Account created successfully. Please log in.",
      result,
    );
  } catch (err) {
    return errorResponse(res, err.statusCode || STATUS_CODES.BAD_REQUEST, RESPONSE_MESSAGES.ERROR, err.message, err);
  }
};
