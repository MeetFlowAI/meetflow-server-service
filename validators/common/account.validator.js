export const updateProfileSchema = {
  first_name: { required: false, type: "string", minLength: 1, maxLength: 50 },
  last_name: { required: false, type: "string", minLength: 1, maxLength: 50 },
};

export const changePasswordSchema = {
  currentPassword: { required: true, type: "string", minLength: 6 },
  newPassword: { required: true, type: "string", minLength: 8 },
};
