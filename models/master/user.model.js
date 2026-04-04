export const MasterUserModel = (sequelize, DataTypes) => {
  const MasterUserSchema = sequelize.define(
    "MasterUser",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      first_name: {
        type: DataTypes.STRING(50),
        trim: true,
        allowNull: false,
        required: [true, "First name is required."],
      },
      last_name: {
        type: DataTypes.STRING(50),
        trim: true,
        allowNull: false,
        required: [true, "Last name is required."],
      },
      email: {
        type: DataTypes.STRING(120),
        trim: true,
        unique: true,
        allowNull: false,
        validate: { isEmail: true },
        required: [true, "Email is required."],
      },
      password: {
        type: DataTypes.STRING(100),
        allowNull: false,
        required: [true, "Password is required."],
      },
      role_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      last_login: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      // Password reset fields
      password_reset_token: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      password_reset_expires_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      isDeleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: "master_users",
      schema: "master_tenant",
      timestamps: true,
    },
  );

  return MasterUserSchema;
};

export default MasterUserModel;
