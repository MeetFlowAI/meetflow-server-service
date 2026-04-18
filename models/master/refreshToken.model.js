export const RefreshTokenModel = (sequelize, DataTypes) => {
  const RefreshTokenSchema = sequelize.define(
    "RefreshToken",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },

      // For master users: references master_tenant.master_users.id
      // For org users: stores the org user id (scoped under tenant_schema)
      user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },

      // ✅ "master" | schema_name e.g. "org_acme_com"
      // Always set — master users get user_type = "master", org users get schema_name
      user_type: {
        type: DataTypes.STRING(100),
        allowNull: false,
        defaultValue: "master",
      },

      token: {
        type: DataTypes.TEXT,
        allowNull: false,
      },

      expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },

      // Null for master users, schema_name for org users
      // Kept for quick lookup without decoding JWT
      tenant_schema: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },

      device_info: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      ip_address: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },

      is_revoked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },

      revoked_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "refresh_tokens",
      schema: "master_tenant",
      timestamps: true,
      underscored: true,
      indexes: [
        { unique: true, fields: ["token"] },
        { fields: ["user_id", "user_type"] },
        { fields: ["tenant_schema"] },
      ],
    },
  );

  return RefreshTokenSchema;
};

export default RefreshTokenModel;
