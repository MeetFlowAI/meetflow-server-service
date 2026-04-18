import { Op } from "sequelize";
import { initTenantModels } from "../../models/index.js";
import { masterDb } from "../../models/index.js";
import { INVITATION_STATUS } from "../../constants/index.js";

// ─── Org Dashboard Repository ─────────────────────────────────────────────────

/**
 * Returns aggregated stats for the org home/dashboard panel:
 * total members, pending invitations, active workspaces, channels.
 */
export const getOrgStats = async (schema) => {
  const tenantDb = initTenantModels(schema);

  const [
    totalMembers,
    activeMembers,
    pendingInvitations,
    totalWorkspaces,
    totalChannels,
  ] = await Promise.all([
    tenantDb.User.count({ where: { is_deleted: false } }),
    tenantDb.User.count({ where: { is_deleted: false, is_active: true } }),
    tenantDb.Invitation.count({
      where: {
        status: INVITATION_STATUS.PENDING,
        expires_at: { [Op.gt]: new Date() },
      },
    }),
    tenantDb.Workspace.count(),
    tenantDb.Channel.count(),
  ]);

  return {
    totalMembers,
    activeMembers,
    pendingInvitations,
    totalWorkspaces,
    totalChannels,
  };
};

/**
 * Returns the org record from master_tenant plus the linked plan.
 * Used by GET /organization/me
 */
export const getOrgWithPlan = async (schema) => {
  return masterDb.Organization.findOne({
    where: { schema_name: schema, is_deleted: false },
    include: [
      {
        model: masterDb.Plan,
        as: "plan",
        attributes: ["id", "name", "description", "price", "billing_cycle"],
      },
    ],
  });
};

/**
 * Returns the plan limits for the org's current plan.
 */
export const getOrgPlanLimits = async (planId) => {
  return masterDb.PlanLimit.findAll({
    where: { plan_id: planId },
    order: [["limit_key", "ASC"]],
  });
};

/**
 * Returns the plan_limit_usage rows for the org (org-level limits only, workspace_id IS NULL).
 */
export const getOrgLimitUsage = async (schema) => {
  const tenantDb = initTenantModels(schema);
  return tenantDb.PlanLimitUsage.findAll({
    where: { workspace_id: null },
    order: [["limit_key", "ASC"]],
  });
};

/**
 * Update org profile fields stored in master_tenant.organizations.
 * Allowed: name, display_name, logo, official_email
 */
export const updateOrgSettings = async (schema, data) => {
  const org = await masterDb.Organization.findOne({
    where: { schema_name: schema, is_deleted: false },
  });
  if (!org) return null;
  await masterDb.Organization.update(data, { where: { id: org.id } });
  return getOrgWithPlan(schema);
};
