"use strict";

/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize, schema) {
  const schemaName = schema || "public";

  await queryInterface.sequelize.query(`
    ALTER TABLE "${schemaName}".meetings ADD COLUMN IF NOT EXISTS livekit_egress_id VARCHAR(255);
  `);
}

export async function down(queryInterface, Sequelize, schema) {
  const schemaName = schema || "public";

  await queryInterface.sequelize.query(`
    ALTER TABLE "${schemaName}".meetings DROP COLUMN IF EXISTS livekit_egress_id;
  `);
}
