export const updateOrgSettingsSchema = {
  name: { required: false, type: "string", minLength: 2, maxLength: 120 },
  display_name: {
    required: false,
    type: "string",
    minLength: 2,
    maxLength: 100,
  },
  official_email: { required: false, type: "string", isEmail: true },
  logo: { required: false, type: "string", maxLength: 500 },
};
