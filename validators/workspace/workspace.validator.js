export const createWorkspaceSchema = {
  name: { required: true, type: "string", minLength: 2, maxLength: 255 },
  description: { required: false, type: "string", maxLength: 1000 },
  // owner_id: org user who becomes workspace_owner (optional — defaults to creator)
  owner_id: { required: false, type: "number", min: 1 },
  // member_ids: array of org user IDs to bulk-add as workspace_member at creation
  member_ids: { required: false, type: "array" },
};

export const updateWorkspaceSchema = {
  name: { required: false, type: "string", minLength: 2, maxLength: 255 },
  description: { required: false, type: "string", maxLength: 1000 },
};
