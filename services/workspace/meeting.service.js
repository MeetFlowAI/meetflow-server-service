/**
 * services/workspace/meeting.service.js
 *
 * All meeting business logic lives here.
 *
 * Key flows:
 *   startMeeting  → validate → check plan limits → create LiveKit room → save DB → return token
 *   joinMeeting   → validate → check plan limits → save participant → return token
 *   endMeeting    → validate permissions → delete LiveKit room → update DB
 *   getMeetings   → paginated list for a channel
 *   getMeetingDetail → single meeting + participants
 */

import { v4 as uuidv4 } from "uuid";
import * as MeetingRepository from "../../repositories/workspace/meeting.repository.js";
import * as ChannelRepository from "../../repositories/workspace/channel.repository.js";
import * as WorkspaceRepository from "../../repositories/workspace/workspace.repository.js";
import * as WorkspaceMemberRepository from "../../repositories/workspace/workspaceMember.repository.js";
import { masterDb } from "../../models/index.js";
import {
  createLiveKitRoom,
  deleteLiveKitRoom,
  getLiveKitParticipants,
  generateJoinToken,
  startRoomRecording,
  stopRoomRecording,
} from "../../utils/livekit.util.js";
import { USER_ROLES } from "../../constants/index.js";
import { triggerAIPipeline } from "../ai/ai.service.js";
import { envConfig } from "../../config/env.config.js";

// ─── Plan limit helpers ───────────────────────────────────────────────────────

const getPlanLimits = async (tenantSchema) => {
  const org = await masterDb.Organization.findOne({
    where: { schema_name: tenantSchema },
    attributes: ["plan_id"],
  });
  if (!org?.plan_id) return {};

  const limits = await masterDb.PlanLimit.findAll({
    where: { plan_id: org.plan_id },
  });

  return limits.reduce((acc, l) => {
    acc[l.limit_key] = l.limit_value; // -1 = unlimited
    return acc;
  }, {});
};

// Throw 403 if limit is exceeded. Skips check if limit is -1 (unlimited) or missing.
const enforceLimit = (limits, key, current, label) => {
  const max = limits?.[key];
  if (max === undefined || max === null || max === -1) return;
  if (current >= max) {
    throw Object.assign(
      new Error(
        `Your plan allows a maximum of ${max} ${label}. Please upgrade to get more.`,
      ),
      { statusCode: 403 },
    );
  }
};

// ─── Shared validation helper ─────────────────────────────────────────────────

const validateChannelAccess = async (
  tenantSchema,
  workspaceId,
  channelId,
  userId,
) => {
  const workspace = await WorkspaceRepository.getWorkspaceById(
    tenantSchema,
    workspaceId,
  );
  if (!workspace) {
    throw Object.assign(new Error("Workspace not found."), { statusCode: 404 });
  }

  const channel = await ChannelRepository.getChannelById(
    tenantSchema,
    channelId,
  );
  if (!channel || String(channel.workspace_id) !== String(workspaceId)) {
    throw Object.assign(new Error("Channel not found."), { statusCode: 404 });
  }

  const membership = await WorkspaceMemberRepository.getWorkspaceMember(
    tenantSchema,
    workspaceId,
    userId,
  );
  if (!membership) {
    throw Object.assign(new Error("You are not a member of this workspace."), {
      statusCode: 403,
    });
  }

  return { workspace, channel, membership };
};

// ─── START MEETING ────────────────────────────────────────────────────────────

export const startMeeting = async ({
  tenantSchema,
  workspaceId,
  channelId,
  userId,
  title,
}) => {
  try {
    await validateChannelAccess(tenantSchema, workspaceId, channelId, userId);

    // Block if a meeting is already active in this channel
    const existing = await MeetingRepository.getActiveMeetingInChannel(
      tenantSchema,
      channelId,
    );
    if (existing) {
      throw Object.assign(
        new Error(
          "A meeting is already active in this channel. Join it instead.",
        ),
        { statusCode: 409 },
      );
    }

    // Plan limit: meetings per month
    const limits = await getPlanLimits(tenantSchema);
    const meetingsThisMonth = await MeetingRepository.countMeetingsThisMonth(
      tenantSchema,
      workspaceId,
    );
    enforceLimit(
      limits,
      "max_meetings_per_month",
      meetingsThisMonth,
      "meetings per month",
    );

    // Max participants limit drives LiveKit room cap
    const maxParticipants =
      parseInt(limits?.max_meeting_participants, 10) > 0
        ? parseInt(limits.max_meeting_participants, 10)
        : 100;

    // Generate a unique room name for LiveKit
    // Format: mf-<uuid>   (short, URL-safe)
    const livekitRoomName = `mf-${uuidv4()}`;

    // Create room on LiveKit cloud (non-blocking for user — very fast ~100ms)
    await createLiveKitRoom(livekitRoomName, maxParticipants, 300);

    // Start recording immediately after room creation
    // Egress uploads audio to Supabase Storage when stopped
    const { egressId, expectedUrl } = await startRoomRecording(livekitRoomName);

    // Save meeting record
    const meeting = await MeetingRepository.createMeeting(tenantSchema, {
      channel_id: channelId,
      workspace_id: workspaceId,
      title: title?.trim() || "Meeting",
      status: "active",
      started_by_id: userId,
      started_at: new Date(),
      livekit_room_name: livekitRoomName,
      participant_count: 1,
      livekit_egress_id: egressId || null,
      recording_url: expectedUrl || null,
    });

    // Record host as first participant
    await MeetingRepository.upsertParticipant(
      tenantSchema,
      meeting.id,
      userId,
      "host",
    );

    // Generate join token for the host
    // We need user info for display name — fetch from DB
    const { initTenantModels } = await import("../../models/index.js");
    const db = initTenantModels(tenantSchema);
    const user = await db.User.findOne({
      where: { id: userId },
      attributes: ["id", "first_name", "last_name"],
    });
    const participantName = user
      ? `${user.first_name} ${user.last_name}`.trim()
      : `User ${userId}`;

    const token = await generateJoinToken({
      roomName: livekitRoomName,
      identity: String(userId),
      participantName,
      isHost: true,
    });

    return {
      meeting: formatMeeting(meeting),
      livekit_room_name: livekitRoomName,
      token, // ← frontend passes this directly to <LiveKitRoom server={LK_URL} token={token} />
      livekit_url: envConfig.LIVEKIT_URL,
      role: "host",
    };
  } catch (err) {
    throw { statusCode: err.statusCode || 500, message: err.message };
  }
};

// ─── JOIN MEETING ─────────────────────────────────────────────────────────────

export const joinMeeting = async ({
  tenantSchema,
  workspaceId,
  channelId,
  meetingId,
  userId,
}) => {
  try {
    await validateChannelAccess(tenantSchema, workspaceId, channelId, userId);

    const meeting = await MeetingRepository.getMeetingById(
      tenantSchema,
      meetingId,
    );
    if (!meeting) {
      throw Object.assign(new Error("Meeting not found."), { statusCode: 404 });
    }
    if (
      String(meeting.channel_id) !== String(channelId) ||
      String(meeting.workspace_id) !== String(workspaceId)
    ) {
      throw Object.assign(new Error("Meeting not found in this channel."), {
        statusCode: 404,
      });
    }
    if (meeting.status !== "active") {
      throw Object.assign(new Error("This meeting has already ended."), {
        statusCode: 410,
      });
    }

    // Plan limit: max participants
    const limits = await getPlanLimits(tenantSchema);
    const currentCount = await MeetingRepository.countParticipants(
      tenantSchema,
      meetingId,
    );
    enforceLimit(
      limits,
      "max_meeting_participants",
      currentCount,
      "participants per meeting",
    );

    // Record this participant (upsert handles rejoins)
    await MeetingRepository.upsertParticipant(
      tenantSchema,
      meeting.id,
      userId,
      "guest",
    );

    // Update participant count
    const newCount = Math.max(meeting.participant_count, currentCount + 1);
    await MeetingRepository.updateMeeting(tenantSchema, meeting.id, {
      participant_count: newCount,
    });

    // Get display name
    const { initTenantModels } = await import("../../models/index.js");
    const db = initTenantModels(tenantSchema);
    const user = await db.User.findOne({
      where: { id: userId },
      attributes: ["id", "first_name", "last_name"],
    });
    const participantName = user
      ? `${user.first_name} ${user.last_name}`.trim()
      : `User ${userId}`;

    const token = await generateJoinToken({
      roomName: meeting.livekit_room_name,
      identity: String(userId),
      participantName,
      isHost: false,
    });

    return {
      meeting: formatMeeting(meeting),
      livekit_room_name: meeting.livekit_room_name,
      token,
      livekit_url: envConfig.LIVEKIT_URL,
      role: "guest",
    };
  } catch (err) {
    throw { statusCode: err.statusCode || 500, message: err.message };
  }
};

// ─── END MEETING ──────────────────────────────────────────────────────────────

export const endMeeting = async ({
  tenantSchema,
  workspaceId,
  channelId,
  meetingId,
  userId,
  userOrgRole,
}) => {
  try {
    const meeting = await MeetingRepository.getMeetingById(
      tenantSchema,
      meetingId,
    );
    if (!meeting) {
      throw Object.assign(new Error("Meeting not found."), { statusCode: 404 });
    }
    if (
      String(meeting.channel_id) !== String(channelId) ||
      String(meeting.workspace_id) !== String(workspaceId)
    ) {
      throw Object.assign(new Error("Meeting not found in this channel."), {
        statusCode: 404,
      });
    }
    if (meeting.status !== "active") {
      throw Object.assign(new Error("This meeting has already ended."), {
        statusCode: 410,
      });
    }

    // Only host, workspace owner/admin, or org admin can end for everyone
    const isHost = String(meeting.started_by_id) === String(userId);
    const isOrgAdmin = [
      USER_ROLES.ORGANIZATION.ORGANIZATION_SUPER_ADMIN,
      USER_ROLES.ORGANIZATION.ORGANIZATION_ADMIN,
    ].includes(userOrgRole);

    const wsMembership = await WorkspaceMemberRepository.getWorkspaceMember(
      tenantSchema,
      workspaceId,
      userId,
    );
    const isWsAdmin =
      wsMembership?.role === USER_ROLES.WORKSPACE.WORKSPACE_OWNER ||
      wsMembership?.role === USER_ROLES.WORKSPACE.WORKSPACE_ADMIN;

    if (!isHost && !isOrgAdmin && !isWsAdmin) {
      throw Object.assign(
        new Error(
          "Only the meeting host, workspace admin, or org admin can end this meeting for everyone.",
        ),
        { statusCode: 403 },
      );
    }

    await stopRoomRecording(meeting.livekit_egress_id);

    const recordingUrl = meeting.recording_url;

    await deleteLiveKitRoom(meeting.livekit_room_name).catch((err) => {
      // Room may already be empty/gone — non-fatal
      console.warn(`⚠️ Could not delete LiveKit room: ${err.message}`);
    });

    const endedAt = new Date();

    const updated = await MeetingRepository.updateMeeting(
      tenantSchema,
      meetingId,
      {
        status: "ended",
        ended_at: endedAt,
        // Set AI status immediately so frontend knows pipeline is starting.
        // setImmediate will overwrite ai_meeting_id once AI service responds,
        // but ai_status="processing" must be visible before the response goes out.
        ai_status: "processing",
        ai_stage: "transcription",
      },
    );

    // ── Trigger AI pipeline (non-blocking) ─────────────────────────────────
    // Run after response — does not delay the user's "End Meeting" action.
    // Requires: workspace.ai_channel_id + meeting.recording_url
    setImmediate(async () => {
      try {
        const workspace = await WorkspaceRepository.getWorkspaceById(
          tenantSchema,
          workspaceId,
        );
        if (!workspace?.ai_channel_id) {
          console.log(
            `ℹ️ AI: workspace ${workspaceId} has no ai_channel_id — pipeline skipped`,
          );
          return;
        }

        // Use the recordingUrl from the outer scope (already fetched from stopRoomRecording)
        // Do NOT read updated.recording_url — that shadows the outer variable and
        // may be stale if Sequelize hasn't fully committed yet.
        const audioUrl = recordingUrl;
        if (!audioUrl) {
          console.log(
            `ℹ️ AI: meeting ${meetingId} has no recording_url — pipeline skipped`,
          );
          return;
        }

        // Collect AI participant IDs from workspace members who joined this meeting
        const participants = await MeetingRepository.getParticipantsByMeeting(
          tenantSchema,
          meetingId,
        );
        const aiParticipantIds = [];
        for (const p of participants) {
          const wm = await WorkspaceMemberRepository.getWorkspaceMember(
            tenantSchema,
            workspaceId,
            p.user_id,
          );
          if (wm?.ai_participant_id) {
            aiParticipantIds.push(wm.ai_participant_id);
          }
        }

        // external_id lets the webhook handler route back to the right tenant + meeting
        const externalId = `${tenantSchema}__${meetingId}`;

        const aiResult = await triggerAIPipeline({
          audioUrl: recordingUrl,
          aiChannelId: workspace.ai_channel_id,
          externalId,
          meetingType: updated.meeting_type || "general",
          participantIds: aiParticipantIds,
          webhookUrl: envConfig.BACKEND_WEBHOOK_URL,
        });

        await MeetingRepository.updateMeeting(tenantSchema, meetingId, {
          ai_meeting_id: aiResult.meeting_id,
          // ai_status: "processing",
          // ai_stage: "transcription",
        });

        console.log(
          `🤖 AI pipeline triggered for meeting ${meetingId} → AI ID: ${aiResult.meeting_id}`,
        );
      } catch (aiErr) {
        console.error(
          `❌ AI pipeline failed for meeting ${meetingId}: ${aiErr.message}`,
        );
        // Mark as failed so frontend can show appropriate state
        await MeetingRepository.updateMeeting(tenantSchema, meetingId, {
          ai_status: "failed",
        }).catch(() => {});
      }
    });

    return formatMeeting(updated);
  } catch (err) {
    throw { statusCode: err.statusCode || 500, message: err.message };
  }
};

// ─── GET MEETINGS (list) ──────────────────────────────────────────────────────

export const getMeetings = async ({
  tenantSchema,
  workspaceId,
  channelId,
  userId,
  skip,
  limit,
}) => {
  try {
    const membership = await WorkspaceMemberRepository.getWorkspaceMember(
      tenantSchema,
      workspaceId,
      userId,
    );
    if (!membership) {
      throw Object.assign(
        new Error("You are not a member of this workspace."),
        { statusCode: 403 },
      );
    }
    return await MeetingRepository.getMeetingsByChannel(
      tenantSchema,
      channelId,
      { skip, limit },
    );
  } catch (err) {
    throw { statusCode: err.statusCode || 500, message: err.message };
  }
};

// ─── GET MEETING DETAIL ───────────────────────────────────────────────────────

export const getMeetingDetail = async ({
  tenantSchema,
  workspaceId,
  channelId,
  meetingId,
  userId,
}) => {
  try {
    const membership = await WorkspaceMemberRepository.getWorkspaceMember(
      tenantSchema,
      workspaceId,
      userId,
    );
    if (!membership) {
      throw Object.assign(
        new Error("You are not a member of this workspace."),
        { statusCode: 403 },
      );
    }

    const meeting = await MeetingRepository.getMeetingById(
      tenantSchema,
      meetingId,
    );
    if (!meeting || String(meeting.channel_id) !== String(channelId)) {
      throw Object.assign(new Error("Meeting not found."), { statusCode: 404 });
    }

    const participants = await MeetingRepository.getParticipantsByMeeting(
      tenantSchema,
      meetingId,
    );

    // If meeting is still active, also pull live participants from LiveKit
    let liveParticipants = [];
    if (meeting.status === "active") {
      liveParticipants = await getLiveKitParticipants(
        meeting.livekit_room_name,
      );
    }

    return {
      meeting: formatMeeting(meeting),
      participants,
      live_participant_count:
        meeting.status === "active" ? liveParticipants.length : null,
    };
  } catch (err) {
    throw { statusCode: err.statusCode || 500, message: err.message };
  }
};

// ─── LiveKit Webhook handler ──────────────────────────────────────────────────
/**
 * LiveKit calls our webhook when room events happen.
 * We use this to auto-end meetings when the room closes (everyone left).
 *
 * Event types we handle:
 *   room_finished → room was closed (either by us or because it went empty past emptyTimeout)
 *
 * LiveKit webhook docs: https://docs.livekit.io/realtime/server/webhooks/
 */
export const handleLiveKitWebhook = async (event) => {
  try {
    const { event: eventType, room } = event;

    if (!room?.name) return;

    const livekitRoomName = room.name;

    // Only process rooms we created (our rooms start with "mf-")
    if (!livekitRoomName.startsWith("mf-")) return;

    if (eventType === "room_finished") {
      // Find the meeting across all tenant schemas by room name
      // We store the tenantSchema in the room name: mf-<uuid>
      // We need to query master to find which org this belongs to
      // Strategy: query all orgs and check each tenant schema
      const orgs = await masterDb.Organization.findAll({
        attributes: ["schema_name"],
        where: { is_active: true },
      });

      for (const org of orgs) {
        const schema = org.schema_name;
        try {
          const meeting = await MeetingRepository.getMeetingByRoomName(
            schema,
            livekitRoomName,
          );
          if (meeting && meeting.status === "active") {
            const endedAt = new Date();
            await MeetingRepository.updateMeeting(schema, meeting.id, {
              status: "ended",
              ended_at: endedAt,
            });
            console.log(
              `✅ Webhook: Auto-ended meeting ${meeting.id} (room: ${livekitRoomName})`,
            );
            break; // Found and updated — stop searching
          }
        } catch {
          // Schema might not have meetings table yet — skip
        }
      }
    }

    if (eventType === "participant_joined") {
      // Optional: real-time participant count sync
      console.log(`📥 Webhook: Participant joined room ${livekitRoomName}`);
    }

    if (eventType === "participant_left") {
      console.log(`📤 Webhook: Participant left room ${livekitRoomName}`);
    }
  } catch (err) {
    console.error("LiveKit webhook handling error:", err.message);
    // Never throw — webhook endpoints MUST return 200 or LiveKit will retry
  }
};

// ─── Formatter ────────────────────────────────────────────────────────────────

const formatMeeting = (m) => ({
  id: m.id,
  title: m.title,
  status: m.status,
  channel_id: m.channel_id,
  workspace_id: m.workspace_id,
  started_by_id: m.started_by_id,
  host: m.host || null,
  started_at: m.started_at,
  ended_at: m.ended_at,
  participant_count: m.participant_count,
  livekit_room_name: m.livekit_room_name,
  livekit_egress_id: m.livekit_egress_id || null,
  meeting_type: m.meeting_type || "general",
  ai_status: m.ai_status || "not_triggered",
  ai_stage: m.ai_stage || null,
  ai_meeting_id: m.ai_meeting_id || null,
  recording_url: m.recording_url || null,
  created_at: m.createdAt,
});
