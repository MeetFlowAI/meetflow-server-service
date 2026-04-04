import { Router } from "express";
import * as AccountController from "../../controllers/common/account.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { validate } from "../../validators/index.js";
import {
  updateProfileSchema,
  changePasswordSchema,
} from "../../validators/common/account.validator.js";

const AccountRoutes = Router();

AccountRoutes.get("/get-profile", authenticate, AccountController.getProfile);
AccountRoutes.post(
  "/update-profile",
  authenticate,
  validate(updateProfileSchema),
  AccountController.updateProfile,
);
AccountRoutes.put(
  "/change-password",
  authenticate,
  validate(changePasswordSchema),
  AccountController.changePassword,
);

export default AccountRoutes;
