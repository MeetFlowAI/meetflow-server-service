export const sendInvitationSchema = {
  email: { required: true, type: "string", isEmail: true },
  role_id: { required: true, type: "number", min: 1 },
};

export const acceptInvitationSchema = {
  token: { required: true, type: "string", minLength: 10 },
  tenant_schema: { required: true, type: "string", minLength: 3 },
  first_name: { required: true, type: "string", minLength: 1, maxLength: 50 },
  last_name: { required: true, type: "string", minLength: 1, maxLength: 50 },
  password: { required: true, type: "string", minLength: 8 },
};
