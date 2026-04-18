export const PlanLimitModel = (sequelize, DataTypes) => {
  const PlanLimitSchema = sequelize.define(
    "PlanLimit",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      plan_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      limit_key: {
        type: DataTypes.STRING(100), // e.g., "max_users", "max_workspaces"
        allowNull: false,
      },
      limit_value: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
    },
    {
      tableName: "plan_limits",
      schema: "master_tenant",
      timestamps: true,
      underscored: true,
      indexes: [{ unique: true, fields: ["plan_id", "limit_key"] }],
    },
  );

  return PlanLimitSchema;
};

export default PlanLimitModel;
