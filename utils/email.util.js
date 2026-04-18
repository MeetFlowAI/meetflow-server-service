import nodemailer from "nodemailer";
import { envConfig } from "../config/env.config.js";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: envConfig.MAIL_FROM_ADDRESS,
    pass: envConfig.MAIL_APP_PASSWORD,
  },
});

// ─── Password Reset ────────────────────────────────────────────────────────────

export const sendPasswordResetEmail = async (
  toEmail,
  name,
  rawToken,
  tenantSchema = null,
) => {
  const frontendUrl =
    process.env.FRONTEND_SERVICE_URL || "http://localhost:5173";
  const resetUrl = tenantSchema
    ? `${frontendUrl}/reset-password?token=${rawToken}&schema=${tenantSchema}`
    : `${frontendUrl}/reset-password?token=${rawToken}`;

  await transporter.sendMail({
    from: `"MeetFlow Support" <${envConfig.MAIL_FROM_ADDRESS}>`,
    to: toEmail,
    subject: "Reset your MeetFlow password",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;">
        <h2 style="color:#1a1a2e;">Hi ${name},</h2>
        <p>We received a request to reset your MeetFlow password.</p>
        <p>Click the button below to set a new password. This link expires in <strong>15 minutes</strong>.</p>
        <a href="${resetUrl}"
           style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;
                  text-decoration:none;border-radius:6px;font-weight:600;margin:16px 0;">
          Reset Password
        </a>
        <p style="color:#666;font-size:13px;">
          If you didn't request this, you can safely ignore this email.
        </p>
        <p style="color:#999;font-size:12px;">
          Or copy this link: <a href="${resetUrl}">${resetUrl}</a>
        </p>
      </div>
    `,
  });
};

// ─── Org Created — Official Email ──────────────────────────────────────────────

/**
 * Sent to the org's official_email (e.g. info@acme.com) confirming provisioning.
 *
 * @param {string} toEmail       - official_email of the org
 * @param {string} orgName       - org display name
 * @param {string} domain        - org domain
 * @param {string} schemaName    - provisioned PostgreSQL schema name
 * @param {string} planName      - name of the assigned plan
 */
export const sendOrgCreatedOfficialEmail = async ({
  toEmail,
  orgName,
  domain,
  schemaName,
  planName,
}) => {
  await transporter.sendMail({
    from: `"MeetFlow" <${envConfig.MAIL_FROM_ADDRESS}>`,
    to: toEmail,
    subject: `Your MeetFlow workspace for ${orgName} is ready`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;">
        <h2 style="color:#1a1a2e;">Welcome to MeetFlow, ${orgName}!</h2>
        <p>Your organisation workspace has been successfully provisioned on MeetFlow.</p>

        <div style="background:#f8f9ff;border-left:4px solid #4f46e5;padding:16px 20px;border-radius:4px;margin:20px 0;">
          <p style="margin:0 0 8px;"><strong>Organisation:</strong> ${orgName}</p>
          <p style="margin:0 0 8px;"><strong>Domain:</strong> ${domain}</p>
          <p style="margin:0 0 8px;"><strong>Plan:</strong> ${planName}</p>
          <p style="margin:0;color:#666;font-size:13px;">Schema: ${schemaName}</p>
        </div>

        <p>
          All users with a <strong>@${domain}</strong> email address will be automatically
          routed to your workspace when they log in to MeetFlow.
        </p>
        <p>
          Your organisation admin will receive a separate email with their login credentials
          to get started.
        </p>
        <p style="color:#666;font-size:13px;margin-top:24px;">
          If you have any questions, contact us at
          <a href="mailto:${envConfig.MAIL_FROM_ADDRESS}">${envConfig.MAIL_FROM_ADDRESS}</a>.
        </p>
      </div>
    `,
  });
};

// ─── Owner Welcome — Credentials Email ────────────────────────────────────────

/**
 * Sent to the org super admin's email with their temporary login credentials.
 * The auto-generated password is included — owner must change it on first login.
 *
 * @param {string} toEmail        - owner's work email (primary_owner_email)
 * @param {string} firstName      - owner's first name
 * @param {string} orgName        - org display name
 * @param {string} tempPassword   - the auto-generated plaintext password (sent once, never stored)
 * @param {string} domain         - org domain (so owner knows their login email)
 */
export const sendOwnerWelcomeEmail = async ({
  toEmail,
  firstName,
  orgName,
  tempPassword,
  domain,
}) => {
  const frontendUrl = envConfig.FRONTEND_SERVICE_URL;
  const loginUrl = `${frontendUrl}/login`;

  await transporter.sendMail({
    from: `"MeetFlow" <${envConfig.MAIL_FROM_ADDRESS}>`,
    to: toEmail,
    subject: `You're the admin of ${orgName} on MeetFlow — here are your login details`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;">
        <h2 style="color:#1a1a2e;">Hi ${firstName},</h2>
        <p>
          Your MeetFlow admin account for <strong>${orgName}</strong> has been created.
          Use the credentials below to log in for the first time.
        </p>

        <div style="background:#f8f9ff;border-left:4px solid #4f46e5;padding:16px 20px;border-radius:4px;margin:20px 0;">
          <p style="margin:0 0 8px;"><strong>Login URL:</strong>
            <a href="${loginUrl}">${loginUrl}</a>
          </p>
          <p style="margin:0 0 8px;"><strong>Email:</strong> ${toEmail}</p>
          <p style="margin:0;"><strong>Temporary password:</strong>
            <span style="font-family:monospace;background:#e8eaf6;padding:2px 6px;border-radius:3px;">
              ${tempPassword}
            </span>
          </p>
        </div>

        <p style="color:#c0392b;font-weight:600;">
          You will be asked to set a new password immediately after your first login.
        </p>
        <p>
          As the organisation admin, you can invite team members, create workspaces,
          and configure your MeetFlow settings.
        </p>
        <p style="color:#666;font-size:13px;margin-top:24px;">
          If you didn't expect this email, please contact us at
          <a href="mailto:${envConfig.MAIL_FROM_ADDRESS}">${envConfig.MAIL_FROM_ADDRESS}</a>.
        </p>
      </div>
    `,
  });
};

// ─── Invitation Email ──────────────────────────────────────────────────────────

/**
 * Sent to the invited person with a link to accept the invitation.
 *
 * @param {string} toEmail      - the invited person's email
 * @param {string} orgName      - org display name
 * @param {string} roleName     - role they are being invited as
 * @param {string} token        - raw invitation token
 * @param {string} tenantSchema - org schema name (embedded in the accept link)
 */
export const sendInvitationEmail = async ({
  toEmail,
  orgName,
  roleName,
  token,
  tenantSchema,
}) => {
  const frontendUrl = envConfig.FRONTEND_SERVICE_URL || "http://localhost:5173";
  const acceptUrl = `${frontendUrl}/invite/accept?token=${token}&schema=${tenantSchema}`;

  await transporter.sendMail({
    from: `"MeetFlow" <${envConfig.MAIL_FROM_ADDRESS}>`,
    to: toEmail,
    subject: `You've been invited to join ${orgName} on MeetFlow`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;">
        <h2 style="color:#1a1a2e;">You're invited!</h2>
        <p>
          You have been invited to join <strong>${orgName}</strong> on MeetFlow
          as <strong>${roleName}</strong>.
        </p>
        <p>Click the button below to accept your invitation and set up your account.
           This link expires in <strong>7 days</strong>.</p>
        <a href="${acceptUrl}"
           style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;
                  text-decoration:none;border-radius:6px;font-weight:600;margin:16px 0;">
          Accept Invitation
        </a>
        <p style="color:#666;font-size:13px;">
          If you didn't expect this invitation, you can safely ignore this email.
        </p>
        <p style="color:#999;font-size:12px;">
          Or copy this link: <a href="${acceptUrl}">${acceptUrl}</a>
        </p>
      </div>
    `,
  });
};
