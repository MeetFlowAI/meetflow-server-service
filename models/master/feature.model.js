export const FeatureModel = (sequelize, DataTypes) => {
  const FeatureSchema = sequelize.define(
    "Feature",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      feature_key: {
        type: DataTypes.STRING(100),
        unique: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: "features",
      schema: "master_tenant",
      timestamps: true,
      underscored: true,
    },
  );

  return FeatureSchema;
};

export default FeatureModel;
