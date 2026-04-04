const USER_ROLES = {
  MASTER: {
    MASTER_SUPER_ADMIN: "master_super_admin",
    MASTER_ADMIN: "master_admin",
    MASTER_MEMBER: "master_member",
  },
  ORGANIZATION: {
    ORGANIZATION_SUPER_ADMIN: "organization_super_admin",
    ORGANIZATION_ADMIN: "organization_admin",
    ORGANIZATION_MEMBER: "organization_member",
  },
  WORKSPACE: {
    WORKSPACE_OWNER: "workspace_owner",
    WORKSPACE_ADMIN: "workspace_admin",
    WORKSPACE_MEMBER: "workspace_member",
  },
};

export const TOKEN_EXPIRY = {
  ACCESS: "1d",
  REFRESH: "7d",
  REMEMBER_ME: "30d",
  // Reset token validity — 15 minutes
  RESET: 15 * 60 * 1000, // in milliseconds
};

const PLANS = {
  FREE: "free",
  PRO: "pro",
  ENTERPRISE: "enterprise",
};

const PLAN_BILLING_CYCLES = {
  MONTHLY: "monthly",
  YEARLY: "yearly",
  LIFETIME: "lifetime",
};

const SUBSCRIPTION_STATUSES = {
  ACTIVE: "active",
  TRIAL: "trial",
  INACTIVE: "inactive",
  CANCELLED: "cancelled",
  SUSPENDED: "suspended",
  EXPIRED: "expired",
};

const INVITATION_STATUS = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  DECLINED: "declined",
  EXPIRED: "expired",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
};

const WORKSPACE_DASHBOARD_ROLES = {
  OWNER: "owner",
  ADMIN: "admin",
  MEMBER: "member",
};

const WORKSPACE_CHANNEL_TYPES = {
  PUBLIC: "public",
  PRIVATE: "private",
};

const MASTER_SCHEMA = "master_tenant";

// Free/personal email domains that cannot be registered as org domains
const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "icloud.com",
  "protonmail.com",
  "live.com",
  "msn.com",
  "aol.com",
  "ymail.com",
  "rediffmail.com",
  "zohomail.com",
  "mail.com",
  "gmx.com",
]);

export {
  USER_ROLES,
  PLANS,
  PLAN_BILLING_CYCLES,
  SUBSCRIPTION_STATUSES,
  INVITATION_STATUS,
  WORKSPACE_DASHBOARD_ROLES,
  WORKSPACE_CHANNEL_TYPES,
  MASTER_SCHEMA,
  FREE_EMAIL_DOMAINS,
};
