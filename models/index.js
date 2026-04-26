import { Sequelize, DataTypes } from "sequelize";
import { dbConfig } from "../config/db.config.js";
import {
  runTenantMigrations,
  runMigrationsForAllTenants,
} from "../migrations/migrationRunner.js";

// ================= INIT SEQUELIZE ================= //
const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.DIALECT,
  port: dbConfig.PORT,
  logging: false,
  ...(dbConfig.dialectOptions && { dialectOptions: dbConfig.dialectOptions }),
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
import MeetingModel from "./workspace/meeting.model.js";
import MeetingParticipantModel from "./workspace/meetingParticipant.model.js";

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
  MasterUser.belongsTo(MasterRole, { foreignKey: "role_id", as: "role" });
  MasterRole.hasMany(MasterUser, { foreignKey: "role_id" });

  // Organization ↔ Plan
  Organization.belongsTo(Plan, { foreignKey: "plan_id", as: "plan" });
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
  // MasterUser.hasMany(RefreshToken, { foreignKey: "user_id" });
  // RefreshToken.belongsTo(MasterUser, { foreignKey: "user_id" });
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
  tenantDb.Meeting = MeetingModel(sequelize, DataTypes, options);
  tenantDb.MeetingParticipant = MeetingParticipantModel(
    sequelize,
    DataTypes,
    options,
  );

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
    Invitation,
    Workspace,
    WorkspaceMember,
    Channel,
    ChannelMember,
    PlanLimitUsage,
    Meeting,
    MeetingParticipant,
  } = db;

  // User ↔ Role
  User.belongsTo(Role, { foreignKey: "role_id", as: "role" });
  Role.hasMany(User, { foreignKey: "role_id" });

  // Invitation → invited by User
  Invitation.belongsTo(User, { foreignKey: "invited_by_id", as: "invitedBy" });
  User.hasMany(Invitation, { foreignKey: "invited_by_id" });

  // Workspace → Plan Limit Usage
  Workspace.hasMany(PlanLimitUsage, { foreignKey: "workspace_id" });
  PlanLimitUsage.belongsTo(Workspace, { foreignKey: "workspace_id" });

  // Workspace → Creator
  Workspace.belongsTo(User, { foreignKey: "created_by_id", as: "creator" });

  // Workspace ↔ Users (M:N)
  Workspace.belongsToMany(User, {
    through: WorkspaceMember,
    foreignKey: "workspace_id",
  });
  User.belongsToMany(Workspace, {
    through: WorkspaceMember,
    foreignKey: "user_id",
  });

  // WorkspaceMember → User (direct, for include with alias)
  WorkspaceMember.belongsTo(User, { foreignKey: "user_id", as: "member" });
  User.hasMany(WorkspaceMember, { foreignKey: "user_id" });

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

  // ChannelMember → User (direct, for include with alias)
  ChannelMember.belongsTo(User, { foreignKey: "user_id", as: "channelUser" });
  User.hasMany(ChannelMember, { foreignKey: "user_id" });

  // Meeting → Channel
  Meeting.belongsTo(Channel, { foreignKey: "channel_id" });
  Channel.hasMany(Meeting, { foreignKey: "channel_id" });

  // Meeting → Workspace
  Meeting.belongsTo(Workspace, { foreignKey: "workspace_id" });
  Workspace.hasMany(Meeting, { foreignKey: "workspace_id" });

  // Meeting → User (host/started_by)
  Meeting.belongsTo(User, { foreignKey: "started_by_id", as: "host" });
  User.hasMany(Meeting, { foreignKey: "started_by_id" });

  // MeetingParticipant → Meeting
  MeetingParticipant.belongsTo(Meeting, { foreignKey: "meeting_id" });
  Meeting.hasMany(MeetingParticipant, { foreignKey: "meeting_id" });

  // MeetingParticipant → User
  MeetingParticipant.belongsTo(User, {
    foreignKey: "user_id",
    as: "participant",
  });
  User.hasMany(MeetingParticipant, { foreignKey: "user_id" });
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

  await tenantDb.Role.sync(syncOptions);
  await tenantDb.User.sync(syncOptions);
  await tenantDb.Invitation.sync(syncOptions);

  // Workspace must sync BEFORE PlanLimitUsage (which has FK to Workspace)
  await tenantDb.Workspace.sync(syncOptions);
  await tenantDb.PlanLimitUsage.sync(syncOptions);

  await tenantDb.WorkspaceMember.sync(syncOptions);
  await tenantDb.Channel.sync(syncOptions);
  await tenantDb.ChannelMember.sync(syncOptions);

  // Meeting must sync AFTER Channel and Workspace (foreign keys)
  await tenantDb.Meeting.sync(syncOptions);
  await tenantDb.MeetingParticipant.sync(syncOptions);

  console.log(`✅ Tables synced for tenant: ${schemaName}`);

  // 4. Run pending migrations
  await runTenantMigrations(sequelize, schemaName);

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

    await masterDb.MasterRole.sync();
    await masterDb.MasterUser.sync();
    await masterDb.Plan.sync();
    await masterDb.Feature.sync();
    await masterDb.PlanFeature.sync();
    await masterDb.PlanLimit.sync();
    await masterDb.Organization.sync();
    await masterDb.RefreshToken.sync();

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
  masterDb,
  initTenantModels,
  provisionTenantSchema,
  initializeDatabase,
  runTenantMigrations,
  runMigrationsForAllTenants,
};
