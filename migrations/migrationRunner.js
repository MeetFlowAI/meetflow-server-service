import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Run all tenant migrations for a specific schema
 * @param {Sequelize} sequelize - Sequelize instance
 * @param {string} schemaName - Tenant schema name
 */
export async function runTenantMigrations(sequelize, schemaName) {
  try {
    // Create migrations tracking table if it doesn't exist
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "${schemaName}".sequelizemeta (
        name VARCHAR(255) PRIMARY KEY
      );
    `);

    const migrationsDir = path.join(__dirname, 'tenant');
    const files = fs.readdirSync(migrationsDir).sort();

    for (const file of files) {
      if (!file.endsWith('.js')) continue;

      // Check if migration has already been run
      const [results] = await sequelize.query(
        `SELECT name FROM "${schemaName}".sequelizemeta WHERE name = ?`,
        { replacements: [file] }
      );

      if (results.length > 0) {
        console.log(`⏭️  Skipping ${file} (already migrated for ${schemaName})`);
        continue;
      }

      // Import and run migration
      const migrationPath = path.join(migrationsDir, file);
      const { up } = await import(`file://${migrationPath}`);

      console.log(`🔄 Running migration ${file} for schema ${schemaName}...`);
      await up(sequelize.getQueryInterface(), sequelize.Sequelize, schemaName);

      // Record migration
      await sequelize.query(
        `INSERT INTO "${schemaName}".sequelizemeta (name) VALUES (?)`,
        { replacements: [file] }
      );

      console.log(`✅ Completed ${file} for ${schemaName}`);
    }

    console.log(`✅ All tenant migrations completed for ${schemaName}`);
  } catch (error) {
    console.error(`❌ Migration failed for ${schemaName}:`, error);
    throw error;
  }
}

/**
 * Run migrations for all existing tenant schemas
 * @param {Sequelize} sequelize - Sequelize instance
 */
export async function runMigrationsForAllTenants(sequelize) {
  try {
    // Get all schemas except master_tenant, public, and PostgreSQL system schemas
    const [schemas] = await sequelize.query(`
      SELECT schema_name FROM information_schema.schemata
      WHERE schema_name NOT IN ('master_tenant', 'public', 'information_schema', 'pg_catalog', 'pg_toast')
      AND schema_name NOT LIKE 'pg_%'
      ORDER BY schema_name;
    `);

    console.log(`\n🔍 Found ${schemas.length} tenant schemas to migrate`);

    for (const schema of schemas) {
      const schemaName = schema.schema_name;
      console.log(`\n📊 Migrating schema: ${schemaName}`);
      await runTenantMigrations(sequelize, schemaName);
    }

    console.log(`\n✅ All tenant schemas have been migrated`);
  } catch (error) {
    console.error(`❌ Failed to run migrations for all tenants:`, error);
    throw error;
  }
}
