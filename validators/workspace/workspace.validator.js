export const createWorkspaceSchema = {
  name: { required: true, type: "string", minLength: 2, maxLength: 255 },
  description: { required: false, type: "string", maxLength: 1000 },
};

export const updateWorkspaceSchema = {
  name: { required: false, type: "string", minLength: 2, maxLength: 255 },
  description: { required: false, type: "string", maxLength: 1000 },
};
