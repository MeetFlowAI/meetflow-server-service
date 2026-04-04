import { PLAN_BILLING_CYCLES } from "../../constants/index.js";

export const PlanModel = (sequelize, DataTypes) => {
  const PlanSchema = sequelize.define(
    "Plan",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(70),
        trim: true,
        unique: true,
        allowNull: false,
        required: [true, "Name is required."],
      },
      description: {
        type: DataTypes.TEXT,
        trim: true,
        allowNull: false,
        required: [true, "Summary is required."],
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      billing_cycle: {
        type: DataTypes.ENUM(Object.values(PLAN_BILLING_CYCLES)),
        defaultValue: PLAN_BILLING_CYCLES.MONTHLY,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: "plans",
      schema: "master_tenant",
      timestamps: true,
    },
  );

  return PlanSchema;
};

export default PlanModel;
