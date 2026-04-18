import { Router } from "express";
import * as UserController from "../../controllers/master/user.controller.js";
import {
  authenticate,
  requireMasterContext,
} from "../../middlewares/auth.middleware.js";
import { validate, validateBulk } from "../../validators/index.js";
import {
  createUserSchema,
  updateUserSchema,
  bulkCreateUserSchema,
  bulkUpdateUserSchema,
} from "../../validators/master/user.validator.js";

const UserRoutes = Router();

UserRoutes.use(authenticate, requireMasterContext);

// ─── Single-Record Routes ─────────────────────────────────────────────────────
// GET    /master/users/get-all-users
// GET    /master/users/get-user-by-id/:id
// POST   /master/users/create-user
// PATCH  /master/users/update-user/:id
// DELETE /master/users/delete-user/:id

UserRoutes.get("/get-all-users", UserController.getAllUsers);
UserRoutes.get("/get-user-by-id/:id", UserController.getUserById);
UserRoutes.post("/create-user", validate(createUserSchema), UserController.createUser);
UserRoutes.patch("/update-user/:id", validate(updateUserSchema), UserController.updateUser);
UserRoutes.delete("/delete-user/:id", UserController.deleteUser);

// ─── Bulk Routes ──────────────────────────────────────────────────────────────
// POST   /master/users/bulk-create   { items: [...] }
// PATCH  /master/users/bulk-update   { items: [{id, ...}, ...] }
// DELETE /master/users/bulk-delete   { ids: [...] }

UserRoutes.post(
  "/bulk-create",
  validateBulk(bulkCreateUserSchema),
  UserController.bulkCreateUsers,
);
UserRoutes.patch(
  "/bulk-update",
  validateBulk(bulkUpdateUserSchema),
  UserController.bulkUpdateUsers,
);
UserRoutes.delete(
  "/bulk-delete",
  validateBulk(null, { mode: "ids" }),
  UserController.bulkDeleteUsers,
);

export default UserRoutes;
