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
      // UUID of this member's Participant record in the AI service
      // Set after voiceprint enrollment
      ai_participant_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      voice_enrolled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
    },
    {
      tableName: "workspace_members",
      schema: options.schema,
      timestamps: true,
      underscored: true,
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
