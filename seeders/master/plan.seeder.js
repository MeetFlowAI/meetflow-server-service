import { PLAN_BILLING_CYCLES, PLANS } from "../../constants/index.js";

export const seedPlans = async (db) => {
  const plans = [
    {
      name: PLANS.FREE,
      description: "Free plan",
      price: 0,
      billing_cycle: PLAN_BILLING_CYCLES.MONTHLY,
    },
    {
      name: PLANS.PRO,
      description: "Pro plan",
      price: 499,
      billing_cycle: PLAN_BILLING_CYCLES.MONTHLY,
    },
    {
      name: PLANS.ENTERPRISE,
      description: "Enterprise plan",
      price: 999,
      billing_cycle: PLAN_BILLING_CYCLES.MONTHLY,
    },
  ];

  for (const plan of plans) {
    const exists = await db.Plan.findOne({ where: { name: plan.name } });

    if (!exists) {
      await db.Plan.create(plan);
    }
  }

  console.log("✅ Plans seeded");
};
