export const MeetingParticipantModel = (sequelize, DataTypes, options = {}) => {
  const modelName = options.modelSuffix
    ? `MeetingParticipant${options.modelSuffix}`
    : "MeetingParticipant";

  const MeetingParticipant = sequelize.define(
    modelName,
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      meeting_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      joined_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      left_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      duration_seconds: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      // "host" = started the meeting | "guest" = joined
      livekit_role: {
        type: DataTypes.STRING(50),
        defaultValue: "guest",
        allowNull: false,
      },
    },
    {
      tableName: "meeting_participants",
      schema: options.schema,
      timestamps: true,
      underscored: true,
      indexes: [
        { unique: true, fields: ["meeting_id", "user_id"] },
        { fields: ["meeting_id"] },
        { fields: ["user_id"] },
      ],
    },
  );

  return MeetingParticipant;
};

export default MeetingParticipantModel;
