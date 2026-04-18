import { USER_ROLES, USER_ROLES_DISPLAY_NAME } from "../../constants/index.js";

export const seedMasterRoles = async (db) => {
  const roles = [
    {
      name: USER_ROLES.MASTER.MASTER_SUPER_ADMIN,
      display_name: USER_ROLES_DISPLAY_NAME.MASTER.MASTER_SUPER_ADMIN,
      description: "Full system access",
      is_system: true,
    },
    {
      name: USER_ROLES.MASTER.MASTER_ADMIN,
      display_name: USER_ROLES_DISPLAY_NAME.MASTER.MASTER_ADMIN,
      description: "Limited admin access",
      is_system: true,
    },
    {
      name: USER_ROLES.MASTER.MASTER_MEMBER,
      display_name: USER_ROLES_DISPLAY_NAME.MASTER.MASTER_MEMBER,
      description: "Basic access",
      is_system: true,
    },
  ];

  for (const role of roles) {
    const existing = await db.MasterRole.findOne({
      where: { name: role.name },
    });

    if (!existing) {
      await db.MasterRole.create(role);
    }
  }

  console.log("✅ Master roles seeded");
};
