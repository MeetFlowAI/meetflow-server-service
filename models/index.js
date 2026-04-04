import { Sequelize, DataTypes } from "sequelize";
import { dbConfig } from "../config/db.config.js";

// ================= INIT SEQUELIZE ================= //
const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.DIALECT,
  port: dbConfig.PORT,
  logging: false,
  pool: {
    max: dbConfig.pool.max,
    min: dbConfig.pool.min,
    acquire: dbConfig.pool.acquire,
    idle: dbConfig.pool.idle,
  },
});

// ================= IMPORT MASTER MODELS ================= //
import MasterRoleModel from "./master/role.model.js";
import MasterUserModel from "./master/user.model.js";
import PlanModel from "./master/plan.model.js";
import FeatureModel from "./master/feature.model.js";
import PlanFeatureModel from "./master/planFeature.model.js";
import PlanLimitModel from "./master/planLimit.model.js";
import OrganizationModel from "./master/organization.model.js";
import RefreshTokenModel from "./master/refreshToken.model.js";

// ================= IMPORT ORGANIZATION MODELS ================= //
import OrgRoleModel from "./organization/role.model.js";
import OrgUserModel from "./organization/user.model.js";
import InvitationModel from "./organization/invitation.model.js";
import PlanLimitUsageModel from "./organization/planLimitUsage.model.js";

// ================= IMPORT WORKSPACE MODELS ================= //
import WorkspaceModel from "./workspace/workspace.model.js";
import WorkspaceMemberModel from "./workspace/workspaceMember.model.js";
import ChannelModel from "./workspace/channel.model.js";
import ChannelMemberModel from "./workspace/channelMember.model.js";

import { runMasterSeeders } from "../seeders/index.js";

// ================= MASTER DB (singleton) =================
const masterDb = {};

masterDb.MasterRole = MasterRoleModel(sequelize, DataTypes);
masterDb.MasterUser = MasterUserModel(sequelize, DataTypes);
masterDb.Plan = PlanModel(sequelize, DataTypes);
masterDb.Feature = FeatureModel(sequelize, DataTypes);
masterDb.PlanFeature = PlanFeatureModel(sequelize, DataTypes);
masterDb.PlanLimit = PlanLimitModel(sequelize, DataTypes);
masterDb.Organization = OrganizationModel(sequelize, DataTypes);
masterDb.RefreshToken = RefreshTokenModel(sequelize, DataTypes);

const applyMasterAssociations = () => {
  const {
    MasterRole,
    MasterUser,
    Plan,
    Feature,
    PlanFeature,
    PlanLimit,
    Organization,
    RefreshToken,
  } = masterDb;

  // User ↔ Role
  MasterUser.belongsTo(MasterRole, { foreignKey: "role_id", as: "MasterRole" });
  MasterRole.hasMany(MasterUser, { foreignKey: "role_id" });

  // Organization ↔ Plan
  Organization.belongsTo(Plan, { foreignKey: "plan_id" });
  Plan.hasMany(Organization, { foreignKey: "plan_id" });

  // Plan ↔ Feature (M:N)
  Plan.belongsToMany(Feature, { through: PlanFeature, foreignKey: "plan_id" });
  Feature.belongsToMany(Plan, {
    through: PlanFeature,
    foreignKey: "feature_id",
  });

  // Plan → Limits
  Plan.hasMany(PlanLimit, { foreignKey: "plan_id" });
  PlanLimit.belongsTo(Plan, { foreignKey: "plan_id" });

  // User ↔ Refresh Token
  MasterUser.hasMany(RefreshToken, { foreignKey: "user_id" });
  RefreshToken.belongsTo(MasterUser, { foreignKey: "user_id" });
};

// Apply master associations
applyMasterAssociations();

// ===============================================================
// TENANT FACTORY
// ---------------------------------------------------------------

// Cache to avoid re-defining models for the same schema
const tenantModelCache = new Map();

const initTenantModels = (schema) => {
  if (tenantModelCache.has(schema)) {
    return tenantModelCache.get(schema);
  }

  const tenantDb = {};
  const options = { schema, modelSuffix: `_${schema}` };

  tenantDb.Role = OrgRoleModel(sequelize, DataTypes, options);
  tenantDb.User = OrgUserModel(sequelize, DataTypes, options);
  tenantDb.Invitation = InvitationModel(sequelize, DataTypes, options);
  tenantDb.PlanLimitUsage = PlanLimitUsageModel(sequelize, DataTypes, options);

  tenantDb.Workspace = WorkspaceModel(sequelize, DataTypes, options);
  tenantDb.WorkspaceMember = WorkspaceMemberModel(
    sequelize,
    DataTypes,
    options,
  );
  tenantDb.Channel = ChannelModel(sequelize, DataTypes, options);
  tenantDb.ChannelMember = ChannelMemberModel(sequelize, DataTypes, options);

  // Apply tenant associations
  applyTenantAssociations(tenantDb);

  // Add to cache
  tenantModelCache.set(schema, tenantDb);

  return tenantDb;
};

const applyTenantAssociations = (db) => {
  const {
    Role,
    User,
    Workspace,
    WorkspaceMember,
    Channel,
    ChannelMember,
    PlanLimitUsage,
  } = db;

  // User ↔ Role
  User.belongsTo(Role, { foreignKey: "role_id", as: "Role" });
  Role.hasMany(User, { foreignKey: "role_id" });

  // Workspace → Plan Limit Usage
  Workspace.hasMany(PlanLimitUsage, { foreignKey: "workspace_id" });
  PlanLimitUsage.belongsTo(Workspace, { foreignKey: "workspace_id" });

  // Workspace → Creator
  Workspace.belongsTo(User, { foreignKey: "created_by_id", as: "Creator" });

  // Workspace ↔ Users (M:N)
  Workspace.belongsToMany(User, {
    through: WorkspaceMember,
    foreignKey: "workspace_id",
  });
  User.belongsToMany(Workspace, {
    through: WorkspaceMember,
    foreignKey: "user_id",
  });

  // Channel → Workspace
  Channel.belongsTo(Workspace, { foreignKey: "workspace_id" });
  Workspace.hasMany(Channel, { foreignKey: "workspace_id" });

  // Channel ↔ Users (M:N)
  Channel.belongsToMany(User, {
    through: ChannelMember,
    foreignKey: "channel_id",
  });
  User.belongsToMany(Channel, {
    through: ChannelMember,
    foreignKey: "user_id",
  });
};

// ===============================================================
// TENANT PROVISIONING
// ---------------------------------------------------------------
// Called once when a NEW organisation is created.
// Creates the schema in Postgres and syncs all tenant tables into it.
// Never called again for that org — subsequent calls use initTenantModels().
// ===============================================================

const provisionTenantSchema = async (schemaName) => {
  // 1. Create the Postgres schema
  await sequelize.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}";`);
  console.log(`✅ Schema created: ${schemaName}`);

  // 2. Init models pointing at the new schema
  const tenantDb = initTenantModels(schemaName);

  // 3. Sync ONLY the models that belong to this tenant schema
  const syncOptions = { schema: schemaName };

  await tenantDb.Role.sync({ alter: true, ...syncOptions });
  await tenantDb.User.sync({ alter: true, ...syncOptions });
  await tenantDb.Invitation.sync({ alter: true, ...syncOptions });

  // Workspace must sync BEFORE PlanLimitUsage (which has FK to Workspace)
  await tenantDb.Workspace.sync({ alter: true, ...syncOptions });
  await tenantDb.PlanLimitUsage.sync({ alter: true, ...syncOptions });

  await tenantDb.WorkspaceMember.sync({ alter: true, ...syncOptions });
  await tenantDb.Channel.sync({ alter: true, ...syncOptions });
  await tenantDb.ChannelMember.sync({ alter: true, ...syncOptions });

  console.log(`✅ Tables synced for tenant: ${schemaName}`);

  return tenantDb;
};

// ===============================================================
// DATABASE INITIALISATION
// ---------------------------------------------------------------

const initializeDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected successfully.");

    // Ensure master schema exists
    await sequelize.query(`CREATE SCHEMA IF NOT EXISTS master_tenant;`);
    console.log("✅ master_tenant schema ready");

    await masterDb.MasterRole.sync({ alter: true });
    await masterDb.MasterUser.sync({ alter: true });
    await masterDb.Plan.sync({ alter: true });
    await masterDb.Feature.sync({ alter: true });
    await masterDb.PlanFeature.sync({ alter: true });
    await masterDb.PlanLimit.sync({ alter: true });
    await masterDb.Organization.sync({ alter: true });
    await masterDb.RefreshToken.sync({ alter: true });

    console.log("✅ Master models synchronised");

    // Run seeders (roles, plans, super admin etc.)
    await runMasterSeeders();
  } catch (error) {
    console.error("❌ Database initialisation failed:", error);
    process.exit(1);
  }
};

// ===============================================================
// EXPORTS
// ===============================================================
export {
  sequelize,
  masterDb, // use directly for all master_tenant queries
  initTenantModels, // use per-request to get tenant models
  provisionTenantSchema, // use once when creating a new org
  initializeDatabase, // call at server startup
};
