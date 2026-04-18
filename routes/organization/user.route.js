import { Router } from "express";
import * as UserController from "../../controllers/organization/user.controller.js";
import {
  authenticate,
  requireOrgContext,
  authorize,
} from "../../middlewares/auth.middleware.js";
import { validate } from "../../validators/index.js";
import { USER_ROLES } from "../../constants/index.js";
import { updateUserRoleSchema } from "../../validators/organization/user.validator.js";

const UserRoutes = Router();

UserRoutes.use(
  authenticate,
  requireOrgContext,
  authorize([
    USER_ROLES.ORGANIZATION.ORGANIZATION_SUPER_ADMIN,
    USER_ROLES.ORGANIZATION.ORGANIZATION_ADMIN,
  ]),
);

// ─── Single-Record Routes ─────────────────────────────────────────────────────
// GET    /organization/users/get-all-users
// GET    /organization/users/get-user-by-id/:id
// POST   /organization/users/create-user
// PATCH  /organization/users/update-user/:id
// DELETE /organization/users/delete-user/:id
// PATCH  /organization/users/deactivate-user/:id
// PATCH  /organization/users/reactivate-user/:id

UserRoutes.get("/get-all-users", UserController.getAllUsers);
UserRoutes.get("/get-user-by-id/:id", UserController.getUserById);
// UserRoutes.post("/create-user", UserController.createUser);
// UserRoutes.patch("/update-user/:id", UserController.updateUser);
UserRoutes.delete("/delete-user/:id", UserController.removeUser);
UserRoutes.patch("/activate-user/:id", UserController.activateUser);
UserRoutes.patch("/deactivate-user/:id", UserController.deactivateUser);

export default UserRoutes;
