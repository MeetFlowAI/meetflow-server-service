export const MasterRoleModel = (sequelize, DataTypes) => {
  const MasterRoleSchema = sequelize.define(
    "MasterRole",
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
        required: [true, "Role name is required."],
      },
      description: {
        type: DataTypes.TEXT,
      },
      is_system: { type: DataTypes.BOOLEAN, defaultValue: true },
    },
    {
      tableName: "roles",
      schema: "master_tenant",
      timestamps: true,
    },
  );

  return MasterRoleSchema;
};

export default MasterRoleModel;
