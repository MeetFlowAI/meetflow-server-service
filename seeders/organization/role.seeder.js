import { USER_ROLES } from "../../constants/index.js";

/**
 * Seeds the 3 default roles into a freshly provisioned tenant schema.
 * Called automatically inside createOrganization — never called manually.
 *
 * Roles created:
 *  - organization_super_admin  (the account owner — gets created once per org)
 *  - organization_admin        (can manage members, workspaces, channels)
 *  - organization_member       (standard user)
 */
export const seedOrgRoles = async (tenantDb) => {
  const roles = [
    {
      name: USER_ROLES.ORGANIZATION.ORGANIZATION_SUPER_ADMIN,
      description:
        "Full control over the organisation — billing, members, settings.",
      is_system: true,
    },
    {
      name: USER_ROLES.ORGANIZATION.ORGANIZATION_ADMIN,
      description: "Can manage members, workspaces and channels.",
      is_system: true,
    },
    {
      name: USER_ROLES.ORGANIZATION.ORGANIZATION_MEMBER,
      description: "Standard organisation member.",
      is_system: true,
    },
  ];

  for (const role of roles) {
    const exists = await tenantDb.Role.findOne({ where: { name: role.name } });
    if (!exists) {
      await tenantDb.Role.create(role);
    }
  }

  console.log("✅ Org default roles seeded");
};
