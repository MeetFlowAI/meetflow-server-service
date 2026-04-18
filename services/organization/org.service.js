import * as OrgRepository from "../../repositories/organization/org.repository.js";

// ─── Org Overview Service ─────────────────────────────────────────────────────

/**
 * Returns org details + plan + live usage stats for the dashboard home page.
 * Used by GET /organization/me
 */
export const getOrgProfile = async ({ tenantSchema }) => {
  try {
    const org = await OrgRepository.getOrgWithPlan(tenantSchema);
    if (!org)
      throw Object.assign(new Error("Organization not found."), {
        statusCode: 404,
      });

    const [stats, planLimits, limitUsage] = await Promise.all([
      OrgRepository.getOrgStats(tenantSchema),
      org.plan_id ? OrgRepository.getOrgPlanLimits(org.plan_id) : [],
      OrgRepository.getOrgLimitUsage(tenantSchema),
    ]);

    // Build a usage map: { limit_key → current_value }
    const usageMap = {};
    for (const u of limitUsage) {
      usageMap[u.limit_key] = u.current_value;
    }

    // Attach current_value to each limit for a single clean response
    const limitsWithUsage = planLimits.map((l) => ({
      limit_key: l.limit_key,
      limit_value: l.limit_value, // -1 = unlimited
      current_value: usageMap[l.limit_key] ?? 0,
    }));

    return {
      organization: org,
      stats,
      plan_limits: limitsWithUsage,
    };
  } catch (err) {
    throw { statusCode: err.statusCode || 500, message: err.message };
  }
};

/**
 * Updates editable org settings stored in master_tenant.organizations.
 * Allowed fields: name, display_name, logo, official_email
 * Domain changes are NOT allowed here — that's a master admin operation.
 */
export const updateOrgSettings = async ({ tenantSchema, data }) => {
  try {
    // Strip fields that should not be changeable via org settings
    const { domain, schema_name, plan_id, subscription_status, ...safeData } =
      data;

    if (Object.keys(safeData).length === 0) {
      throw Object.assign(new Error("No valid fields provided to update."), {
        statusCode: 400,
      });
    }

    const updated = await OrgRepository.updateOrgSettings(
      tenantSchema,
      safeData,
    );
    if (!updated)
      throw Object.assign(new Error("Organization not found."), {
        statusCode: 404,
      });

    return updated;
  } catch (err) {
    throw { statusCode: err.statusCode || 400, message: err.message };
  }
};
