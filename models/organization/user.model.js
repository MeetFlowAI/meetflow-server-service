export const UserModel = (sequelize, DataTypes, options = {}) => {
  // Unique model name per schema — prevents collision across tenants
  const modelName = options.modelSuffix ? `User${options.modelSuffix}` : "User";

  const UserSchema = sequelize.define(
    modelName,
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
      },
      last_name: {
        type: DataTypes.STRING(50),
        trim: true,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(255),
        trim: true,
        unique: true,
        allowNull: false,
        validate: { isEmail: true },
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      role_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      // Forces a password change on next login (set true for auto-generated passwords)
      must_change_password: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      invited_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      invited_by_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
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
      is_deleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: "users",
      schema: options.schema,
      timestamps: true,
    },
  );

  return UserSchema;
};

export default UserModel;
