'use strict';

/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize, schema) {
  const schemaName = schema || 'public';

  await queryInterface.sequelize.query(`
    ALTER TABLE "${schemaName}".meetings ADD COLUMN IF NOT EXISTS ai_meeting_id UUID;
  `);
  await queryInterface.sequelize.query(`
    ALTER TABLE "${schemaName}".meetings ADD COLUMN IF NOT EXISTS ai_status VARCHAR(50) DEFAULT 'not_triggered' NOT NULL;
  `);
  await queryInterface.sequelize.query(`
    ALTER TABLE "${schemaName}".meetings ADD COLUMN IF NOT EXISTS meeting_type VARCHAR(50) DEFAULT 'general' NOT NULL;
  `);
  await queryInterface.sequelize.query(`
    ALTER TABLE "${schemaName}".meetings ADD COLUMN IF NOT EXISTS recording_url TEXT;
  `);
}

export async function down(queryInterface, Sequelize, schema) {
  const schemaName = schema || 'public';

  await queryInterface.sequelize.query(`
    ALTER TABLE "${schemaName}".meetings DROP COLUMN IF EXISTS ai_meeting_id;
  `);
  await queryInterface.sequelize.query(`
    ALTER TABLE "${schemaName}".meetings DROP COLUMN IF EXISTS ai_status;
  `);
  await queryInterface.sequelize.query(`
    ALTER TABLE "${schemaName}".meetings DROP COLUMN IF EXISTS meeting_type;
  `);
  await queryInterface.sequelize.query(`
    ALTER TABLE "${schemaName}".meetings DROP COLUMN IF EXISTS recording_url;
  `);
}
