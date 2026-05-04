/**
 * repositories/workspace/task.repository.js
 *
 * Pure DB access — no business logic here.
 * Every function takes tenantSchema as first arg.
 */

import { Op } from "sequelize";
import { initTenantModels } from "../../models/index.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const withIncludes = (db) => [
  {
    model: db.User,
    as: "assignee",
    attributes: ["id", "first_name", "last_name", "email"],
    required: false,
  },
  {
    model: db.User,
    as: "creator",
    attributes: ["id", "first_name", "last_name", "email"],
  },
];

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export const createTask = async (schema, data) => {
  const db = initTenantModels(schema);
  return db.Task.create(data);
};

export const getTaskById = async (schema, taskId) => {
  const db = initTenantModels(schema);
  return db.Task.findOne({
    where: { id: taskId },
    include: withIncludes(db),
  });
};

export const getTasksByChannel = async (
  schema,
  channelId,
  { skip = 0, limit = 50, status, priority } = {},
) => {
  const db = initTenantModels(schema);

  const where = { channel_id: channelId };
  if (status) where.status = status;
  if (priority) where.priority = priority;

  const { count, rows } = await db.Task.findAndCountAll({
    where,
    include: withIncludes(db),
    order: [
      ["status", "ASC"], // todo < in_progress < done alphabetically doesn't work, so we use separate sort below
      ["created_at", "DESC"],
    ],
    offset: skip,
    limit,
  });

  // Sort in JS: todo → in_progress → done
  const STATUS_ORDER = { todo: 0, in_progress: 1, done: 2 };
  rows.sort(
    (a, b) =>
      (STATUS_ORDER[a.status] ?? 0) - (STATUS_ORDER[b.status] ?? 0) ||
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  return { count, rows };
};

export const updateTask = async (schema, taskId, data) => {
  const db = initTenantModels(schema);
  const [, [updated]] = await db.Task.update(data, {
    where: { id: taskId },
    returning: true,
  });
  return updated;
};

export const deleteTask = async (schema, taskId) => {
  const db = initTenantModels(schema);
  return db.Task.destroy({ where: { id: taskId } });
};

// Used by AI pipeline to bulk-insert tasks extracted from a meeting
export const bulkCreateTasks = async (schema, tasks) => {
  const db = initTenantModels(schema);
  return db.Task.bulkCreate(tasks, { returning: true });
};
