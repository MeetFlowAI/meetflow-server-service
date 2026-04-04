import { INVITATION_STATUS } from "../../constants/index.js";

export const InvitationModel = (sequelize, DataTypes, options = {}) => {
  // Unique model name per schema — prevents collision across tenants
  const modelName = options.modelSuffix
    ? `Invitation${options.modelSuffix}`
    : "Invitation";

  const InvitationSchema = sequelize.define(
    modelName,
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      email: {
        type: DataTypes.STRING(120),
        trim: true,
        allowNull: false,
        required: [true, "Email is required."],
      },
      token: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      role_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      invited_by_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM(Object.values(INVITATION_STATUS)),
        defaultValue: INVITATION_STATUS.PENDING,
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      accepted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      accepted_by_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      bulk_invite_id: {
        type: DataTypes.STRING(36),
        allowNull: true,
      },
    },
    {
      tableName: "invitations",
      schema: options.schema,
      timestamps: true,
      indexes: [{ fields: ["token"] }, { fields: ["status"] }],
    },
  );

  return InvitationSchema;
};

export default InvitationModel;
