export const ChannelMemberModel = (sequelize, DataTypes, options = {}) => {
  const modelName = options.modelSuffix
    ? `ChannelMember${options.modelSuffix}`
    : "ChannelMember";

  const ChannelMemberSchema = sequelize.define(
    modelName,
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      channel_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
    },
    {
      tableName: "channel_members",
      schema: options.schema,
      timestamps: true,
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ["channel_id", "user_id"],
        },
      ],
    },
  );

  return ChannelMemberSchema;
};

export default ChannelMemberModel;
