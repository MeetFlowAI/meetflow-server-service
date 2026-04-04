import bcrypt from "bcrypt";
import { envConfig } from "../../config/env.config.js";

export const seedMasterUser = async (db) => {
  const email = envConfig.HOST_CREDENTIALS.EMAIL;

  const existingUser = await db.MasterUser.findOne({
    where: { email },
  });

  if (existingUser) {
    console.log("ℹ️ Master admin already exists");
    return;
  }

  // get super admin role
  const role = await db.MasterRole.findOne({
    where: { name: envConfig.HOST_CREDENTIALS.ROLE },
  });

  if (!role) {
    throw new Error("❌ Master role not found. Seed roles first.");
  }

  const hashedPassword = await bcrypt.hash(process.env.HOST_PASSWORD, 10);

  console.log(
    "Seeding Master User - Super Admin...",
    envConfig.HOST_CREDENTIALS,
  );
  await db.MasterUser.create({
    first_name: envConfig.HOST_CREDENTIALS.FIRST_NAME,
    last_name: envConfig.HOST_CREDENTIALS.LAST_NAME,
    email,
    password: hashedPassword,
    role_id: role.id,
  });

  console.log("✅ Master User - Super Admin seeded");
};
