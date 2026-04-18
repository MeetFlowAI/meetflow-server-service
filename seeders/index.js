import { masterDb } from "../models/index.js";

import { seedMasterRoles } from "./master/role.seeder.js";
import { seedMasterUser } from "./master/user.seeder.js";
import { seedPlans } from "./master/plan.seeder.js";

export const runMasterSeeders = async () => {
  try {
    console.log("🌱 Starting master seeding...");

    await seedMasterRoles(masterDb);
    await seedMasterUser(masterDb);
    // await seedPlans(masterDb);

    console.log("🔥 Master seeding completed successfully");
  } catch (err) {
    console.error("❌ Master seeding failed", err);
  }
};
