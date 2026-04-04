import { WORKSPACE_CHANNEL_TYPES } from "../../constants/index.js";

export const ChannelModel = (sequelize, DataTypes, options = {}) => {
  const modelName = options.modelSuffix
    ? `Channel${options.modelSuffix}`
    : "Channel";

  const ChannelSchema = sequelize.define(
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
      workspace_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM(Object.values(WORKSPACE_CHANNEL_TYPES)),
        defaultValue: WORKSPACE_CHANNEL_TYPES.PUBLIC,
      },
    },
    {
      tableName: "channels",
      schema: options.schema,
      timestamps: true,
    },
  );

  return ChannelSchema;
};

export default ChannelModel;
