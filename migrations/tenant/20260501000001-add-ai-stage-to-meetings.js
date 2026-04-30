"use strict";

/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize, schema) {
  const schemaName = schema || "public";

  await queryInterface.sequelize.query(`
    ALTER TABLE "${schemaName}".meetings ADD COLUMN IF NOT EXISTS ai_stage VARCHAR(100) DEFAULT NULL;
  `);
}

export async function down(queryInterface, Sequelize, schema) {
  const schemaName = schema || "public";

  await queryInterface.sequelize.query(`
    ALTER TABLE "${schemaName}".meetings DROP COLUMN IF EXISTS ai_stage;
  `);
}
