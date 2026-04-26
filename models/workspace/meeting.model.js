export const MeetingModel = (sequelize, DataTypes, options = {}) => {
  const modelName = options.modelSuffix
    ? `Meeting${options.modelSuffix}`
    : "Meeting";

  const Meeting = sequelize.define(
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
      workspace_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
        defaultValue: "Meeting",
      },
      // "active" while live, "ended" when closed
      status: {
        type: DataTypes.ENUM("active", "ended"),
        defaultValue: "active",
        allowNull: false,
      },
      started_by_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      started_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      ended_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      // ── LiveKit ──────────────────────────────────────────────────────────
      // Unique room name we pass to LiveKit (format: mf-<uuid>)
      livekit_room_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      // Peak participant count (updated on join)
      participant_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      // UUID returned by AI service when pipeline is triggered
      ai_meeting_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      // Track AI processing state independently from meeting status
      ai_status: {
        type: DataTypes.ENUM(
          "not_triggered",
          "processing",
          "pending_review",
          "completed",
          "failed",
        ),
        defaultValue: "not_triggered",
        allowNull: false,
      },
      // Type of meeting — sent to AI for context-aware processing
      meeting_type: {
        type: DataTypes.STRING(50),
        defaultValue: "general",
        allowNull: false,
      },
      // URL of the meeting recording (from LiveKit Egress) — needed by AI pipeline
      recording_url: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "meetings",
      schema: options.schema,
      timestamps: true,
      underscored: true,
      indexes: [
        { fields: ["channel_id"] },
        { fields: ["workspace_id"] },
        { fields: ["status"] },
        { fields: ["started_by_id"] },
      ],
    },
  );

  return Meeting;
};

export default MeetingModel;
