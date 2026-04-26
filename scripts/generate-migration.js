#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import readline from "readline";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (prompt) => new Promise((resolve) => rl.question(prompt, resolve));

const migrations = {
  ADD_COLUMN: "addColumn",
  DROP_COLUMN: "dropColumn",
  RENAME_COLUMN: "renameColumn",
  MODIFY_COLUMN: "modifyColumn",
};

const columnTypes = {
  STRING: "VARCHAR(255)",
  TEXT: "TEXT",
  INTEGER: "INTEGER",
  BOOLEAN: "BOOLEAN",
  UUID: "UUID",
  DATE: "TIMESTAMP",
  JSON: "JSONB",
};

async function main() {
  console.log("\n🚀 Tenant Migration Generator\n");

  const type = await question(
    "Migration type (add/drop/rename/modify): "
  );
  const table = await question("Table name (e.g., meetings): ");
  const column = await question("Column name (e.g., is_recorded): ");

  let migrationSQL = "";
  let downSQL = "";

  if (type.toLowerCase() === "add") {
    const columnType = await question(
      `Column type (${Object.keys(columnTypes).join("/")}): `
    );
    const nullable = await question("Allow NULL? (y/n): ");
    const defaultValue = await question("Default value (leave blank for none): ");

    const sqlType = columnTypes[columnType] || "VARCHAR(255)";
    const notNull = nullable.toLowerCase() === "n" ? " NOT NULL" : "";
    const def = defaultValue ? ` DEFAULT '${defaultValue}'` : "";

    migrationSQL = `
  await queryInterface.sequelize.query(\`
    ALTER TABLE "\${schemaName}".${table} ADD COLUMN IF NOT EXISTS ${column} ${sqlType}${def}${notNull};
  \`);`;

    downSQL = `
  await queryInterface.sequelize.query(\`
    ALTER TABLE "\${schemaName}".${table} DROP COLUMN IF EXISTS ${column};
  \`);`;
  } else if (type.toLowerCase() === "drop") {
    migrationSQL = `
  await queryInterface.sequelize.query(\`
    ALTER TABLE "\${schemaName}".${table} DROP COLUMN IF EXISTS ${column};
  \`);`;

    downSQL = `
  await queryInterface.sequelize.query(\`
    ALTER TABLE "\${schemaName}".${table} ADD COLUMN IF NOT EXISTS ${column} VARCHAR(255);
  \`);`;
  }

  // Generate filename with timestamp
  const timestamp = new Date()
    .toISOString()
    .replace(/[:-]/g, "")
    .split("Z")[0]
    .replace("T", "");
  const filename = `${timestamp}-${type}-${column}-to-${table}.js`;
  const filepath = path.join(__dirname, "../migrations/tenant", filename);

  // Generate migration file
  const template = `"use strict";

/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize, schema) {
  const schemaName = schema || "public";
${migrationSQL}
}

export async function down(queryInterface, Sequelize, schema) {
  const schemaName = schema || "public";
${downSQL}
}
`;

  fs.writeFileSync(filepath, template);

  console.log(`\n✅ Migration created: ${filename}`);
  console.log(`📁 Location: migrations/tenant/${filename}`);
  console.log(`\n📝 To apply this migration to all tenants:`);
  console.log(`   node scripts/migrate-tenants.js\n`);

  rl.close();
}

main().catch((err) => {
  console.error("❌ Error:", err);
  rl.close();
  process.exit(1);
});
