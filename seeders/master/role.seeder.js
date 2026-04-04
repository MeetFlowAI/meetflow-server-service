import { USER_ROLES } from "../../constants/index.js";

export const seedMasterRoles = async (db) => {
  const roles = [
    {
      name: USER_ROLES.MASTER.MASTER_SUPER_ADMIN,
      description: "Full system access",
      is_system: true,
    },
    {
      name: USER_ROLES.MASTER.MASTER_ADMIN,
      description: "Limited admin access",
      is_system: true,
    },
    {
      name: USER_ROLES.MASTER.MASTER_MEMBER,
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
