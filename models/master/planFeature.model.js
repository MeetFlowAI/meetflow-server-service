export const PlanFeatureModel = (sequelize, DataTypes) => {
  const PlanFeatureSchema = sequelize.define(
    "PlanFeature",
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
      feature_id: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: "plan_features",
      schema: "master_tenant",
      timestamps: true,
      underscored: true,
      indexes: [{ unique: true, fields: ["plan_id", "feature_id"] }],
    },
  );

  return PlanFeatureSchema;
};

export default PlanFeatureModel;
