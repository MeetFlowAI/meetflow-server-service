"use strict";

/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize, schema) {
  const schemaName = schema || "public";

  await queryInterface.sequelize.query(`
    ALTER TABLE "${schemaName}".workspace_members ADD COLUMN IF NOT EXISTS ai_participant_id UUID;
  `);
  await queryInterface.sequelize.query(`
    ALTER TABLE "${schemaName}".workspace_members ADD COLUMN IF NOT EXISTS voice_enrolled BOOLEAN DEFAULT false NOT NULL;
  `);
}

export async function down(queryInterface, Sequelize, schema) {
  const schemaName = schema || "public";

  await queryInterface.sequelize.query(`
    ALTER TABLE "${schemaName}".workspace_members DROP COLUMN IF EXISTS ai_participant_id;
  `);
  await queryInterface.sequelize.query(`
    ALTER TABLE "${schemaName}".workspace_members DROP COLUMN IF EXISTS voice_enrolled;
  `);
}
