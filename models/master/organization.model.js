import {
  FREE_EMAIL_DOMAINS,
  SUBSCRIPTION_STATUSES,
} from "../../constants/index.js";

export const OrganizationModel = (sequelize, DataTypes) => {
  const OrganizationSchema = sequelize.define(
    "Organization",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      schema_name: {
        type: DataTypes.STRING(63),
        allowNull: false,
        unique: true,
      },
      name: {
        type: DataTypes.STRING(120),
        trim: true,
        allowNull: false,
      },
      display_name: {
        type: DataTypes.STRING(100),
        trim: true,
        allowNull: false,
      },
      logo: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      // Corporate domain for auto-routing login
      // e.g. "acme.com", "iitb.ac.in"
      // null = org doesn't have domain mapping yet (rare edge case)
      domain: {
        type: DataTypes.STRING(100),
        allowNull: true,
        unique: true,
        validate: {
          isNotFreeEmail(val) {
            if (!val) return;
            if (FREE_EMAIL_DOMAINS.has(val.toLowerCase())) {
              throw new Error(
                "Free/personal email domains cannot be registered as an organisation domain.",
              );
            }
          },
          isLowercase(val) {
            if (val && val !== val.toLowerCase()) {
              throw new Error("Domain must be lowercase.");
            }
          },
        },
      },
      // Company's official contact inbox — e.g. info@acme.com
      // This is where the "org created" notification email is sent.
      // Not tied to any individual user account.
      official_email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
      },
      // Reference to the org super admin — actual user row lives in <schema_name>.users
      // Used for display and lookup only — not a foreign key
      primary_owner_email: {
        type: DataTypes.STRING(100),
        trim: true,
        unique: true,
        allowNull: false,
        validate: {
          isEmail: true,
        },
      },
      // Every org must have a plan — no plan-less orgs allowed
      plan_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      subscription_status: {
        type: DataTypes.ENUM(...Object.values(SUBSCRIPTION_STATUSES)),
        defaultValue: SUBSCRIPTION_STATUSES.TRIAL,
      },
      subscription_start_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      subscription_end_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      // Usage counters — incremented by org/workspace module as resources are created
      current_users_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      current_channels_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      current_meetings_this_month_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      current_workspaces_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      isDeleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: "organizations",
      schema: "master_tenant",
      timestamps: true,
    },
  );

  return OrganizationSchema;
};

export default OrganizationModel;
