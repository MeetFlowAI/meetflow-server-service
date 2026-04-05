export const WorkspaceModel = (sequelize, DataTypes, options = {}) => {
  const modelName = options.modelSuffix
    ? `Workspace${options.modelSuffix}`
    : "Workspace";

  const WorkspaceSchema = sequelize.define(
    modelName,
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      created_by_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: "workspaces",
      schema: options.schema,
      timestamps: true,
      underscored: true,
    },
  );

  return WorkspaceSchema;
};

export default WorkspaceModel;
