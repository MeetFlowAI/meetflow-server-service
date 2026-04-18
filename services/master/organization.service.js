import * as OrganizationRepository from "../../repositories/master/organization.repository.js";
import * as PlanRepository from "../../repositories/master/plan.repository.js";
import { provisionTenantSchema } from "../../models/index.js";
import { isFreeEmailDomain } from "../../utils/auth.util.js";
import { hashPassword } from "../../utils/password.util.js";
import { SUBSCRIPTION_STATUSES, USER_ROLES } from "../../constants/index.js";
import { seedOrgRoles } from "../../seeders/organization/role.seeder.js";
import {
  sendOrgCreatedOfficialEmail,
  sendOwnerWelcomeEmail,
} from "../../utils/email.util.js";
import crypto from "crypto";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * "Grovia" → "grovia_tenant"
 * "TechStart Inc" → "techstart_inc_tenant"
 * Max 63 chars, lowercase, only underscores — valid PostgreSQL schema name.
 */
const displayNameToSchemaName = (displayName) => {
  return (
    displayName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_") // replace non-alphanumeric with underscore
      .replace(/_+/g, "_") + // collapse multiple underscores
    "_tenant"
  );
};

/**
 * Generate a secure random temporary password.
 * Format: 3 uppercase + 3 digits + 3 lowercase + 3 special = 12 chars.
 * Always meets common password policies.
 */
const generateTempPassword = () => {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const digits = "23456789";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const special = "@#$!%*?";
  const pick = (str, n) =>
    Array.from({ length: n }, () => str[crypto.randomInt(str.length)]).join("");
  const raw =
    pick(upper, 3) + pick(digits, 3) + pick(lower, 3) + pick(special, 2);
  // Shuffle to avoid predictable pattern
  return raw
    .split("")
    .sort(() => crypto.randomInt(3) - 1)
    .join("");
};

// ─── Organization Service ─────────────────────────────────────────────────────

export const getAllOrganizations = async (filters) => {
  try {
    return await OrganizationRepository.getAllOrganizations(filters);
  } catch (err) {
    console.log("error:", error);
    throw {
      statusCode: 500,
      message: "Failed to fetch organizations",
      error: err.message,
    };
  }
};

export const getOrganizationById = async (id) => {
  try {
    if (!id) throw new Error("Organization ID is required");
    const organization = await OrganizationRepository.getOrganizationById(id);
    if (!organization) throw new Error("Organization not found");
    return organization;
  } catch (err) {
    throw { statusCode: err.statusCode || 404, message: err.message };
  }
};

/**
 * Full org provisioning — 6 steps:
 *
 *  1. Validate all inputs
 *  2. Domain checks (not free, not duplicate) + plan existence check
 *  3. Create org record in master_tenant.organizations
 *  4. Provision PostgreSQL schema + sync tenant tables
 *  5. Seed default roles → create org super admin in tenant schema
 *  6. Send two emails (official org email + owner credentials email)
 *
 * Request body expected:
 *  Org:   name, display_name, domain, official_email, plan_id
 *  Owner: owner_first_name, owner_last_name, primary_owner_email
 *  Optional: logo, subscription_end_date
 *
 * Note: owner_password is auto-generated — never accepted from the client.
 */
export const createOrganization = async (data) => {
  try {
    console.log("in service");

    // ── 1. Validate required fields ────────────────────────────────────────────
    if (!data.name) throw new Error("Organization name is required");
    if (!data.display_name) throw new Error("Display name is required");
    if (!data.domain) throw new Error("Domain is required");
    if (!data.official_email) throw new Error("Official email is required");
    if (!data.plan_id)
      throw new Error(
        "Plan is required — every organisation must be on a plan",
      );
    if (!data.owner_first_name) throw new Error("Owner first name is required");
    if (!data.owner_last_name) throw new Error("Owner last name is required");
    if (!data.primary_owner_email) throw new Error("Owner email is required");

    // ── 2. Domain checks ───────────────────────────────────────────────────────
    const domain = data.domain.toLowerCase().trim();

    if (isFreeEmailDomain(domain)) {
      throw new Error(
        "Free email domains (gmail, yahoo, etc.) cannot be used as an organisation domain.",
      );
    }

    const existingOrg =
      await OrganizationRepository.getOrganizationByDomain(domain);
    if (existingOrg) {
      throw new Error("An organisation with this domain already exists");
    }

    // Owner email must belong to the org domain
    const ownerEmailDomain = data.primary_owner_email
      .split("@")[1]
      ?.toLowerCase();
    if (ownerEmailDomain !== domain) {
      throw new Error(
        `Owner email must belong to the organisation domain — expected @${domain}`,
      );
    }

    // Plan must exist and be active
    const plan = await PlanRepository.getPlanById(data.plan_id);
    if (!plan) throw new Error("Selected plan not found");
    if (!plan.is_active) throw new Error("Selected plan is not active");

    // ── 3. Create org record ───────────────────────────────────────────────────
    const schema_name = displayNameToSchemaName(data.display_name);

    const org = await OrganizationRepository.createOrganization({
      name: data.name.trim(),
      display_name: data.display_name.trim(),
      domain,
      official_email: data.official_email.toLowerCase().trim(),
      primary_owner_email: data.primary_owner_email.toLowerCase().trim(),
      logo: data.logo || null,
      plan_id: data.plan_id,
      schema_name,
      subscription_status: SUBSCRIPTION_STATUSES.TRIAL,
      subscription_start_date: new Date(),
      subscription_end_date: data.subscription_end_date || null,
      is_active: true,
    });

    // ── 4. Provision PostgreSQL schema + sync tenant tables ────────────────────
    // Creates: <schema_name>.roles, users, invitations,
    //          workspaces, workspace_members, channels, channel_members
    const tenantDb = await provisionTenantSchema(schema_name);

    // ── 5. Seed roles + create org super admin ─────────────────────────────────
    await seedOrgRoles(tenantDb);

    const superAdminRole = await tenantDb.Role.findOne({
      where: { name: USER_ROLES.ORGANIZATION.ORGANIZATION_SUPER_ADMIN },
    });

    if (!superAdminRole) {
      throw new Error(
        "Org super admin role not found after seeding — this is a bug",
      );
    }

    // Auto-generate a strong temporary password — never accept it from the client
    const tempPassword = generateTempPassword();
    const hashedPassword = await hashPassword(tempPassword);

    await tenantDb.User.create({
      first_name: data.owner_first_name.trim(),
      last_name: data.owner_last_name.trim(),
      email: data.primary_owner_email.toLowerCase().trim(),
      password: hashedPassword,
      role_id: superAdminRole.id,
      must_change_password: true, // enforces password change on first login
      is_active: true,
    });

    console.log(
      `✅ Org super admin created in ${schema_name}.users — ${data.primary_owner_email}`,
    );

    // ── 6. Send emails (fire-and-forget — don't fail the request if email fails) ─
    sendOrgCreatedOfficialEmail({
      toEmail: data.official_email,
      orgName: data.display_name,
      domain,
      schemaName: schema_name,
      planName: plan.name,
    }).catch((err) =>
      console.error("⚠️  Official org email failed (non-fatal):", err.message),
    );

    sendOwnerWelcomeEmail({
      toEmail: data.primary_owner_email,
      firstName: data.owner_first_name,
      orgName: data.display_name,
      tempPassword, // plaintext — sent once, then discarded
      domain,
    }).catch((err) =>
      console.error("⚠️  Owner welcome email failed (non-fatal):", err.message),
    );

    // Never return the temp password in the API response
    return org;
  } catch (err) {
    console.log("err:", err);
    throw { statusCode: err.statusCode || 400, message: err.message };
  }
};

export const updateOrganization = async (id, data) => {
  try {
    if (!id) throw new Error("Organization ID is required");

    const organization = await OrganizationRepository.getOrganizationById(id);
    if (!organization) throw new Error("Organization not found");

    if (data.domain && data.domain.toLowerCase() !== organization.domain) {
      if (isFreeEmailDomain(data.domain.toLowerCase())) {
        throw new Error(
          "Free email domains cannot be used as organisation domains.",
        );
      }
      const existingOrg = await OrganizationRepository.getOrganizationByDomain(
        data.domain,
      );
      if (existingOrg)
        throw new Error("An organisation with this domain already exists");
      data = { ...data, domain: data.domain.toLowerCase() };
    }

    return await OrganizationRepository.updateOrganization(id, data);
  } catch (err) {
    throw { statusCode: err.statusCode || 400, message: err.message };
  }
};

export const activateOrganization = async (id) => {
  try {
    if (!id) throw new Error("Organization ID is required");
    const organization = await OrganizationRepository.getOrganizationById(id);
    if (!organization) throw new Error("Organization not found");
    return await OrganizationRepository.activateOrganization(id);
  } catch (err) {
    throw { statusCode: err.statusCode || 400, message: err.message };
  }
};

export const deactivateOrganization = async (id) => {
  try {
    if (!id) throw new Error("Organization ID is required");
    const organization = await OrganizationRepository.getOrganizationById(id);
    if (!organization) throw new Error("Organization not found");
    return await OrganizationRepository.deactivateOrganization(id);
  } catch (err) {
    throw { statusCode: err.statusCode || 400, message: err.message };
  }
};

export const assignPlan = async (id, data) => {
  try {
    if (!id) throw new Error("Organization ID is required");
    if (!data.plan_id) throw new Error("Plan ID is required");

    const organization = await OrganizationRepository.getOrganizationById(id);
    if (!organization) throw new Error("Organization not found");

    const plan = await PlanRepository.getPlanById(data.plan_id);
    if (!plan) throw new Error("Plan not found");
    if (!plan.is_active) throw new Error("Selected plan is not active");

    return await OrganizationRepository.updateOrganization(id, {
      plan_id: data.plan_id,
      subscription_status: SUBSCRIPTION_STATUSES.ACTIVE,
      subscription_start_date: new Date(),
      subscription_end_date: data.subscription_end_date || null,
    });
  } catch (err) {
    throw { statusCode: err.statusCode || 400, message: err.message };
  }
};

export const deleteOrganization = async (id) => {
  try {
    if (!id) throw new Error("Organization ID is required");
    const organization = await OrganizationRepository.getOrganizationById(id);
    if (!organization) throw new Error("Organization not found");
    return await OrganizationRepository.deleteOrganization(id);
  } catch (err) {
    throw { statusCode: err.statusCode || 400, message: err.message };
  }
};

// ─── Bulk helpers ─────────────────────────────────────────────────────────────

/**
 * Build a standard partial-success result object.
 */
const buildBulkResult = (succeeded, failed) => ({
  succeeded,
  failed,
  summary: {
    total: succeeded.length + failed.length,
    success: succeeded.length,
    failed: failed.length,
  },
});

// ─── Bulk Services ────────────────────────────────────────────────────────────

/**
 * Bulk create organizations.
 * Runs SEQUENTIALLY — each org provisions a new Postgres schema (heavy op).
 */
export const bulkCreateOrganizations = async (items) => {
  const succeeded = [];
  const failed = [];
  for (const item of items) {
    try {
      const result = await createOrganization(item);
      succeeded.push(result);
    } catch (err) {
      failed.push({ item, reason: err.message });
    }
  }
  return buildBulkResult(succeeded, failed);
};

/**
 * Bulk update organizations (runs in parallel).
 * Each item must include `id`.
 */
export const bulkUpdateOrganizations = async (items) => {
  const succeeded = [];
  const failed = [];
  await Promise.allSettled(
    items.map(async ({ id, ...data }) => {
      try {
        const result = await updateOrganization(id, data);
        succeeded.push(result);
      } catch (err) {
        failed.push({ item: { id, ...data }, reason: err.message });
      }
    }),
  );
  return buildBulkResult(succeeded, failed);
};

/**
 * Bulk delete organizations (soft delete).
 */
export const bulkDeleteOrganizations = async (ids) => {
  const succeeded = [];
  const failed = [];
  await Promise.allSettled(
    ids.map(async (id) => {
      try {
        const result = await deleteOrganization(id);
        succeeded.push(result);
      } catch (err) {
        failed.push({ item: { id }, reason: err.message });
      }
    }),
  );
  return buildBulkResult(succeeded, failed);
};

/**
 * Bulk activate organizations.
 */
export const bulkActivateOrganizations = async (ids) => {
  const succeeded = [];
  const failed = [];
  await Promise.allSettled(
    ids.map(async (id) => {
      try {
        const result = await activateOrganization(id);
        succeeded.push(result);
      } catch (err) {
        failed.push({ item: { id }, reason: err.message });
      }
    }),
  );
  return buildBulkResult(succeeded, failed);
};

/**
 * Bulk deactivate organizations.
 */
export const bulkDeactivateOrganizations = async (ids) => {
  const succeeded = [];
  const failed = [];
  await Promise.allSettled(
    ids.map(async (id) => {
      try {
        const result = await deactivateOrganization(id);
        succeeded.push(result);
      } catch (err) {
        failed.push({ item: { id }, reason: err.message });
      }
    }),
  );
  return buildBulkResult(succeeded, failed);
};

/**
 * Bulk assign a plan to multiple organizations.
 * Each item: { id, plan_id, subscription_end_date? }
 */
export const bulkAssignPlans = async (items) => {
  const succeeded = [];
  const failed = [];
  await Promise.allSettled(
    items.map(async ({ id, ...data }) => {
      try {
        const result = await assignPlan(id, data);
        succeeded.push(result);
      } catch (err) {
        failed.push({ item: { id, ...data }, reason: err.message });
      }
    }),
  );
  return buildBulkResult(succeeded, failed);
};
