"use strict";

/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize, schema) {
  const s = schema || "public";

  await queryInterface.sequelize.query(`
    CREATE TABLE IF NOT EXISTS "${s}".tasks (
      id            BIGSERIAL PRIMARY KEY,
      channel_id    BIGINT        NOT NULL,
      workspace_id  BIGINT        NOT NULL,
      meeting_id    BIGINT        NULL,
      title         VARCHAR(500)  NOT NULL,
      description   TEXT          NULL,
      status        VARCHAR(50)   NOT NULL DEFAULT 'todo',
      priority      VARCHAR(50)   NOT NULL DEFAULT 'medium',
      assigned_to_id BIGINT       NULL,
      created_by_id  BIGINT       NOT NULL,
      due_date      TIMESTAMPTZ   NULL,
      source        VARCHAR(50)   NOT NULL DEFAULT 'manual',
      created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
      updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
    );
  `);

  // Indexes for common query patterns
  await queryInterface.sequelize.query(
    `CREATE INDEX IF NOT EXISTS tasks_channel_id_idx    ON "${s}".tasks (channel_id);`,
  );
  await queryInterface.sequelize.query(
    `CREATE INDEX IF NOT EXISTS tasks_workspace_id_idx  ON "${s}".tasks (workspace_id);`,
  );
  await queryInterface.sequelize.query(
    `CREATE INDEX IF NOT EXISTS tasks_assigned_to_id_idx ON "${s}".tasks (assigned_to_id);`,
  );
  await queryInterface.sequelize.query(
    `CREATE INDEX IF NOT EXISTS tasks_status_idx        ON "${s}".tasks (status);`,
  );
}

export async function down(queryInterface, Sequelize, schema) {
  const s = schema || "public";
  await queryInterface.sequelize.query(`DROP TABLE IF EXISTS "${s}".tasks;`);
}
