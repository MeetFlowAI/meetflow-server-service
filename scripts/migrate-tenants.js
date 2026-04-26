#!/usr/bin/env node
import { sequelize } from '../models/index.js';
import { runMigrationsForAllTenants } from '../migrations/migrationRunner.js';

/**
 * CLI script to run migrations for all tenant schemas
 * Usage: node scripts/migrate-tenants.js
 */
async function main() {
  try {
    console.log('🚀 Starting tenant migration process...\n');

    // Verify database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established\n');

    // Run migrations for all tenants
    await runMigrationsForAllTenants(sequelize);

    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

main();
