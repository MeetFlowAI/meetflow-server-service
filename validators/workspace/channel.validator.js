import { WORKSPACE_CHANNEL_TYPES } from "../../constants/index.js";

export const createChannelSchema = {
  name: { required: true, type: "string", minLength: 2, maxLength: 255 },
  description: { required: false, type: "string", maxLength: 1000 },
  type: {
    required: false,
    type: "string",
    isEnum: Object.values(WORKSPACE_CHANNEL_TYPES),
  },
};

export const updateChannelSchema = {
  name: { required: false, type: "string", minLength: 2, maxLength: 255 },
  description: { required: false, type: "string", maxLength: 1000 },
};
