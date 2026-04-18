import { USER_ROLES } from "../../constants/index.js";

export const addWorkspaceMemberSchema = {
  user_id: { required: true, type: "number", min: 1 },
  role: {
    required: false,
    type: "string",
    isEnum: Object.values(USER_ROLES.WORKSPACE),
  },
};

export const updateWorkspaceMemberRoleSchema = {
  role: {
    required: true,
    type: "string",
    isEnum: Object.values(USER_ROLES.WORKSPACE),
  },
};
