/**
 * validators/workspace/meeting.validator.js
 *
 * Uses the project's custom validate() middleware — same pattern as channel.validator.js
 */

export const startMeetingSchema = {
  title: {
    required: false,
    type: "string",
    minLength: 1,
    maxLength: 255,
  },
};

// join and end have no body fields to validate — params only
