import { USER_ROLES } from "../../constants/index.js";
export const WorkspaceMemberModel = (sequelize, DataTypes, options = {}) => {
  const modelName = options.modelSuffix
    ? `WorkspaceMember${options.modelSuffix}`
    : "WorkspaceMember";

  const WorkspaceMember = sequelize.define(
    modelName,
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      workspace_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      role: {
        type: DataTypes.ENUM(Object.values(USER_ROLES.WORKSPACE)),
        defaultValue: USER_ROLES.WORKSPACE.MEMBER,
      },
    },
    {
      tableName: "workspace_members",
      schema: options.schema,
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ["workspace_id", "user_id"],
        },
      ],
    },
  );

  return WorkspaceMember;
};

export default WorkspaceMemberModel;
