/**
 * @file     src/config/database.config.js
 * @desc     Sequelize connection options factory.
 *           All database configuration is derived from envConfig — never
 *           from process.env directly.
 *
 *           Two connection modes:
 *             1. CONNECTION_STRING (DATABASE_URL) — Neon, Railway, hosted PG
 *                Requires SSL. Pool is pre-configured for hosted environments.
 *             2. INDIVIDUAL VARS (DB_HOST/USER/NAME/PASSWORD/PORT)
 *                For local Docker / bare PostgreSQL. SSL optional.
 *
 *           Exported:
 *             buildSequelizeOptions(schema) → Sequelize constructor options
 *             getDbCredentials()            → raw connection credentials object
 *
 *           RULES:
 *             - No Sequelize instance is created here (Phase 5).
 *             - No logger import here (Phase 2 — not available yet at Phase 1).
 *             - No model definitions, no associations.
 *             - Only the configuration shape — not the connection itself.
 *
 * @author   Adesh
 * @created  2026-05-03
 */

// ----------------------------------------------------------------------
/* Imports */
import { envConfig } from './env.config.js';

// ----------------------------------------------------------------------
/* Connection pool configuration */

const POOL_CONFIG = Object.freeze({
  max:     10,   // max connections in pool
  min:     2,    // min idle connections kept alive
  acquire: 30_000, // ms before throwing error if connection cannot be acquired
  idle:    10_000, // ms before releasing an idle connection
});

// ----------------------------------------------------------------------

/**
 * Build Sequelize constructor options for a given schema.
 * The schema parameter controls the PostgreSQL search_path — all queries
 * on a tenant connection target that schema's tables.
 *
 * @param  {string} schema - PostgreSQL schema name (e.g. 'master_tenant', 'acme_corp_tenant')
 * @returns {import('sequelize').Options} Sequelize options object
 */
export const buildSequelizeOptions = (schema) => {
  const ssl = envConfig.DB.SSL;

  return {
    dialect:  'postgres',
    schema,

    // Set search_path on every new connection so table references resolve
    // to the correct schema without explicit schema qualification in queries.
    dialectOptions: {
      ...(ssl && {
        ssl: {
          require:            true,
          rejectUnauthorized: false, // Required for Neon/Railway self-signed certs
        },
      }),
      // Ensure search_path is applied on connection acquisition
      options: {
        searchPath: schema ? `"${schema}"` : 'public',
      },
    },

    pool:    POOL_CONFIG,
    logging: false, // All query logging goes through Phase 2 logger, not Sequelize built-in

    // Sequelize defaults that improve production reliability
    define: {
      underscored:  true,  // snake_case column names to match our migration DDL
      timestamps:   true,
      freezeTableName: false,
    },

    // Timezone for all date operations — UTC always, never local
    timezone: '+00:00',
  };
};

/**
 * Return the raw database credentials derived from envConfig.
 * Used by Sequelize constructor when not using a connection string.
 *
 * @returns {{ connectionString: string|null, host: string, port: number, database: string, username: string, password: string }}
 */
export const getDbCredentials = () => ({
  connectionString: envConfig.DB.CONNECTION_STRING,
  host:             envConfig.DB.HOST,
  port:             envConfig.DB.PORT,
  database:         envConfig.DB.NAME,
  username:         envConfig.DB.USER,
  password:         envConfig.DB.PASSWORD,
});
