export const RoleModel = (sequelize, DataTypes, options = {}) => {
  // Unique model name per schema prevents "Model already defined" error
  // when initTenantModels() is called for multiple orgs in the same process.
  // tableName stays "roles" — only the Sequelize JS model name changes.
  const modelName = options.modelSuffix ? `Role${options.modelSuffix}` : "Role";

  const RoleSchema = sequelize.define(
    modelName,
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(100),
        trim: true,
        unique: true,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
      },
      is_system: { type: DataTypes.BOOLEAN, defaultValue: true },
    },
    {
      tableName: "roles",
      schema: options.schema,
      timestamps: true,
      underscored: true,
    },
  );

  return RoleSchema;
};

export default RoleModel;
