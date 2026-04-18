import crypto from "crypto";
import * as InvitationRepository from "../../repositories/organization/invitation.repository.js";
import * as UserRepository from "../../repositories/organization/user.repository.js";
import * as RoleRepository from "../../repositories/organization/role.repository.js";
import { INVITATION_STATUS } from "../../constants/index.js";
import { sendInvitationEmail } from "../../utils/email.util.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const generateInviteToken = () => crypto.randomBytes(32).toString("hex");

// Invitations expire after 7 days
const invitationExpiresAt = () => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d;
};

// ─── Invitation Service ───────────────────────────────────────────────────────

export const getAllInvitations = async ({ tenantSchema, filters }) => {
  try {
    return await InvitationRepository.getAllInvitations(tenantSchema, filters);
  } catch (err) {
    throw {
      statusCode: 500,
      message: "Failed to fetch invitations",
      error: err.message,
    };
  }
};

export const sendInvitation = async ({
  tenantSchema,
  data,
  invitedById,
  orgName,
}) => {
  try {
    const { email, role_id } = data;

    if (!email) throw new Error("Email is required");
    if (!role_id) throw new Error("Role ID is required");

    const normalizedEmail = email.toLowerCase().trim();

    // Check: user already a member
    const existingMember = await UserRepository.getUserByEmail(
      tenantSchema,
      normalizedEmail,
    );
    if (existingMember && !existingMember.is_deleted) {
      throw Object.assign(
        new Error("This email is already a member of the organization."),
        { statusCode: 409 },
      );
    }

    // Check: already has a pending non-expired invitation
    const existingInvite =
      await InvitationRepository.getPendingInvitationByEmail(
        tenantSchema,
        normalizedEmail,
      );
    if (existingInvite) {
      throw Object.assign(
        new Error(
          "A pending invitation already exists for this email. Resend or cancel it first.",
        ),
        { statusCode: 409 },
      );
    }

    // Check: role exists in this org schema
    const role = await RoleRepository.getRoleById(tenantSchema, role_id);
    if (!role)
      throw Object.assign(new Error("Role not found."), { statusCode: 404 });

    const token = generateInviteToken();
    const expires_at = invitationExpiresAt();

    const invitation = await InvitationRepository.createInvitation(
      tenantSchema,
      {
        email: normalizedEmail,
        token,
        role_id,
        invited_by_id: invitedById,
        status: INVITATION_STATUS.PENDING,
        expires_at,
      },
    );

    // Fire-and-forget email
    sendInvitationEmail({
      toEmail: normalizedEmail,
      orgName,
      roleName: role.name,
      token,
      tenantSchema,
    }).catch((err) =>
      console.error("⚠️ Invitation email failed (non-fatal):", err.message),
    );

    return invitation;
  } catch (err) {
    throw { statusCode: err.statusCode || 400, message: err.message };
  }
};

export const resendInvitation = async ({
  tenantSchema,
  invitationId,
  orgName,
}) => {
  try {
    const invitation = await InvitationRepository.getInvitationById(
      tenantSchema,
      invitationId,
    );
    if (!invitation)
      throw Object.assign(new Error("Invitation not found."), {
        statusCode: 404,
      });

    if (invitation.status !== INVITATION_STATUS.PENDING) {
      throw Object.assign(
        new Error("Only pending invitations can be resent."),
        { statusCode: 400 },
      );
    }

    const token = generateInviteToken();
    const expires_at = invitationExpiresAt();

    const updated = await InvitationRepository.updateInvitationToken(
      tenantSchema,
      invitationId,
      token,
      expires_at,
    );

    // Get role name for email
    const role = await RoleRepository.getRoleById(
      tenantSchema,
      invitation.role_id,
    );

    sendInvitationEmail({
      toEmail: invitation.email,
      orgName,
      roleName: role?.name || "member",
      token,
      tenantSchema,
    }).catch((err) =>
      console.error(
        "⚠️ Resend invitation email failed (non-fatal):",
        err.message,
      ),
    );

    return updated;
  } catch (err) {
    throw { statusCode: err.statusCode || 400, message: err.message };
  }
};

export const cancelInvitation = async ({ tenantSchema, invitationId }) => {
  try {
    const invitation = await InvitationRepository.getInvitationById(
      tenantSchema,
      invitationId,
    );
    if (!invitation)
      throw Object.assign(new Error("Invitation not found."), {
        statusCode: 404,
      });

    if (invitation.status !== INVITATION_STATUS.PENDING) {
      throw Object.assign(
        new Error("Only pending invitations can be cancelled."),
        { statusCode: 400 },
      );
    }

    return await InvitationRepository.updateInvitationStatus(
      tenantSchema,
      invitationId,
      INVITATION_STATUS.CANCELLED,
    );
  } catch (err) {
    throw { statusCode: err.statusCode || 400, message: err.message };
  }
};

/**
 * Accept an invitation via a token link.
 * This is a PUBLIC endpoint — no auth needed. The token IS the auth.
 * Creates the user in the tenant schema and marks invitation accepted.
 */
export const acceptInvitation = async ({
  token,
  firstName,
  lastName,
  password,
}) => {
  try {
    if (!token) throw new Error("Invitation token is required");
    if (!firstName) throw new Error("First name is required");
    if (!lastName) throw new Error("Last name is required");
    if (!password || password.length < 8)
      throw new Error("Password must be at least 8 characters");

    // Token encodes schema — we need to find it across master_tenant orgs
    // Frontend sends tenantSchema extracted from the invite link (?schema=xxx)
    throw new Error(
      "acceptInvitation requires tenantSchema — use acceptInvitationWithSchema",
    );
  } catch (err) {
    throw { statusCode: err.statusCode || 400, message: err.message };
  }
};

export const acceptInvitationWithSchema = async ({
  tenantSchema,
  token,
  firstName,
  lastName,
  password,
}) => {
  try {
    if (!token) throw new Error("Invitation token is required");
    if (!firstName) throw new Error("First name is required");
    if (!lastName) throw new Error("Last name is required");
    if (!password || password.length < 8)
      throw new Error("Password must be at least 8 characters");

    const invitation = await InvitationRepository.getInvitationByToken(
      tenantSchema,
      token,
    );
    if (!invitation)
      throw Object.assign(new Error("Invalid invitation token."), {
        statusCode: 400,
      });

    if (invitation.status !== INVITATION_STATUS.PENDING) {
      throw Object.assign(
        new Error(`This invitation has already been ${invitation.status}.`),
        { statusCode: 400 },
      );
    }

    if (new Date(invitation.expires_at) < new Date()) {
      await InvitationRepository.updateInvitationStatus(
        tenantSchema,
        invitation.id,
        INVITATION_STATUS.EXPIRED,
      );
      throw Object.assign(new Error("This invitation has expired."), {
        statusCode: 400,
      });
    }

    // Check user doesn't already exist
    const existingMember = await UserRepository.getUserByEmail(
      tenantSchema,
      invitation.email,
    );
    if (existingMember && !existingMember.is_deleted) {
      throw Object.assign(
        new Error(
          "An account with this email already exists in the organization.",
        ),
        { statusCode: 409 },
      );
    }

    // Hash password and create the user
    const { hashPassword } = await import("../../utils/password.util.js");
    const hashedPassword = await hashPassword(password);

    const { initTenantModels } = await import("../../models/index.js");
    const tenantDb = initTenantModels(tenantSchema);

    const newUser = await tenantDb.User.create({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: invitation.email,
      password: hashedPassword,
      role_id: invitation.role_id,
      invited_at: invitation.createdAt,
      invited_by_id: invitation.invited_by_id,
      is_active: true,
      must_change_password: false,
    });

    // Mark invitation accepted
    await InvitationRepository.updateInvitationStatus(
      tenantSchema,
      invitation.id,
      INVITATION_STATUS.ACCEPTED,
      { accepted_at: new Date(), accepted_by_id: newUser.id },
    );

    return {
      id: newUser.id,
      email: newUser.email,
      first_name: newUser.first_name,
      last_name: newUser.last_name,
    };
  } catch (err) {
    throw { statusCode: err.statusCode || 400, message: err.message };
  }
};
