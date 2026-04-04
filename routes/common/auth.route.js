import { Router } from "express";
import * as AuthController from "../../controllers/common/auth.controller.js";
import { validate } from "../../validators/index.js";
import {
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
  logoutSchema,
} from "../../validators/common/auth.validator.js";

const AuthRoutes = Router();

// ─── Auth ─────────────────────────────────────────────────────────────────────
AuthRoutes.post("/login", validate(loginSchema), AuthController.login);
AuthRoutes.post("/logout", validate(logoutSchema), AuthController.logout);
AuthRoutes.post(
  "/refresh-token",
  validate(refreshTokenSchema),
  AuthController.refreshToken,
);

// ─── Password ─────────────────────────────────────────────────────────────────
AuthRoutes.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  AuthController.forgotPassword,
);
AuthRoutes.post(
  "/reset-password",
  validate(resetPasswordSchema),
  AuthController.resetPassword,
);

export default AuthRoutes;
