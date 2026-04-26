"use strict";

/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize, schema) {
  const schemaName = schema || "public";

  await queryInterface.sequelize.query(`
    ALTER TABLE "${schemaName}".workspaces ADD COLUMN IF NOT EXISTS ai_channel_id UUID;
  `);
}

export async function down(queryInterface, Sequelize, schema) {
  const schemaName = schema || "public";

  await queryInterface.sequelize.query(`
    ALTER TABLE "${schemaName}".workspaces DROP COLUMN IF EXISTS ai_channel_id;
  `);
}
