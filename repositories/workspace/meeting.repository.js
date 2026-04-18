/**
 * repositories/workspace/meeting.repository.js
 *
 * Pure DB access — no business logic here.
 * Every function takes tenantSchema as first arg and resolves the
 * right models via initTenantModels().
 */

import { Op } from "sequelize";
import { initTenantModels } from "../../models/index.js";

// ─── Meeting CRUD ─────────────────────────────────────────────────────────────

export const createMeeting = async (schema, data) => {
  const db = initTenantModels(schema);
  return db.Meeting.create(data);
};

export const getMeetingById = async (schema, meetingId) => {
  const db = initTenantModels(schema);
  return db.Meeting.findOne({
    where: { id: meetingId },
    include: [
      {
        model: db.User,
        as: "host",
        attributes: ["id", "first_name", "last_name", "email"],
      },
    ],
  });
};

export const getMeetingByRoomName = async (schema, livekitRoomName) => {
  const db = initTenantModels(schema);
  return db.Meeting.findOne({ where: { livekit_room_name: livekitRoomName } });
};

export const getActiveMeetingInChannel = async (schema, channelId) => {
  const db = initTenantModels(schema);
  return db.Meeting.findOne({
    where: { channel_id: channelId, status: "active" },
  });
};

export const getMeetingsByChannel = async (
  schema,
  channelId,
  { skip = 0, limit = 20 } = {},
) => {
  const db = initTenantModels(schema);
  const { count, rows } = await db.Meeting.findAndCountAll({
    where: { channel_id: channelId },
    include: [
      {
        model: db.User,
        as: "host",
        attributes: ["id", "first_name", "last_name", "email"],
      },
    ],
    order: [["createdAt", "DESC"]],
    offset: parseInt(skip),
    limit: parseInt(limit),
  });
  return {
    data: rows,
    total: count,
    skip: parseInt(skip),
    limit: parseInt(limit),
  };
};

export const updateMeeting = async (schema, meetingId, data) => {
  const db = initTenantModels(schema);
  await db.Meeting.update(data, { where: { id: meetingId } });
  return getMeetingById(schema, meetingId);
};

// ─── Meeting count helpers (for plan limit checks) ────────────────────────────

// Count meetings started this calendar month in this workspace
export const countMeetingsThisMonth = async (schema, workspaceId) => {
  const db = initTenantModels(schema);
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  return db.Meeting.count({
    where: {
      workspace_id: workspaceId,
      started_at: { [Op.gte]: startOfMonth },
    },
  });
};

// ─── Participant CRUD ─────────────────────────────────────────────────────────

// Upsert: create on first join, update joined_at on rejoin (clears left_at)
export const upsertParticipant = async (
  schema,
  meetingId,
  userId,
  livekitRole = "guest",
) => {
  const db = initTenantModels(schema);
  const [record, created] = await db.MeetingParticipant.findOrCreate({
    where: { meeting_id: meetingId, user_id: userId },
    defaults: {
      meeting_id: meetingId,
      user_id: userId,
      livekit_role: livekitRole,
      joined_at: new Date(),
      left_at: null,
      duration_seconds: null,
    },
  });

  // If they already had a row (rejoin), refresh their joined_at
  if (!created) {
    await record.update({
      joined_at: new Date(),
      left_at: null,
      duration_seconds: null,
      livekit_role: livekitRole,
    });
  }
  return record;
};

export const markParticipantLeft = async (schema, meetingId, userId) => {
  const db = initTenantModels(schema);
  const record = await db.MeetingParticipant.findOne({
    where: { meeting_id: meetingId, user_id: userId },
  });
  if (!record) return null;

  const leftAt = new Date();
  const durationSeconds = Math.floor(
    (leftAt - new Date(record.joined_at)) / 1000,
  );

  await record.update({ left_at: leftAt, duration_seconds: durationSeconds });
  return record;
};

export const countParticipants = async (schema, meetingId) => {
  const db = initTenantModels(schema);
  return db.MeetingParticipant.count({ where: { meeting_id: meetingId } });
};

export const getParticipantsByMeeting = async (schema, meetingId) => {
  const db = initTenantModels(schema);
  return db.MeetingParticipant.findAll({
    where: { meeting_id: meetingId },
    include: [
      {
        model: db.User,
        as: "participant",
        attributes: ["id", "first_name", "last_name", "email"],
      },
    ],
    order: [["joined_at", "ASC"]],
  });
};

export const getParticipantRecord = async (schema, meetingId, userId) => {
  const db = initTenantModels(schema);
  return db.MeetingParticipant.findOne({
    where: { meeting_id: meetingId, user_id: userId },
  });
};
