export const loginSchema = {
  email: { required: true, type: "string", isEmail: true },
  password: { required: true, type: "string", minLength: 6 },
};

export const forgotPasswordSchema = {
  email: { required: true, type: "string", isEmail: true },
};

export const resetPasswordSchema = {
  token: { required: true, type: "string" },
  newPassword: { required: true, type: "string", minLength: 8 },
};

export const refreshTokenSchema = {
  refreshToken: { required: true, type: "string" },
};

export const logoutSchema = {
  refreshToken: { required: true, type: "string" },
};
