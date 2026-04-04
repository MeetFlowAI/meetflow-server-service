export const PlanLimitUsageModel = (sequelize, DataTypes, options = {}) => {
  const modelName = options.modelSuffix
    ? `PlanLimitUsage${options.modelSuffix}`
    : "PlanLimitUsage";

  const PlanLimitUsageSchema = sequelize.define(
    modelName,
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },

      // which limit
      limit_key: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },

      // usage count
      current_value: {
        type: DataTypes.BIGINT,
        allowNull: false,
        defaultValue: 0,
      },

      // for monthly resets
      last_reset_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      // 🔥 IMPORTANT: scope of usage
      workspace_id: {
        type: DataTypes.BIGINT,
        allowNull: true, // NULL = org-level limit
      },
    },
    {
      tableName: "plan_limit_usage",
      schema: options.schema,
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ["limit_key", "workspace_id"],
        },
      ],
    },
  );

  return PlanLimitUsageSchema;
};

export default PlanLimitUsageModel;
