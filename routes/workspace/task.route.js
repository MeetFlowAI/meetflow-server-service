import { Router } from "express";
import * as TaskController from "../../controllers/workspace/task.controller.js";
import {
  authenticate,
  requireOrgContext,
} from "../../middlewares/auth.middleware.js";
import { validate } from "../../validators/index.js";
import {
  createTaskSchema,
  updateTaskSchema,
} from "../../validators/workspace/task.validator.js";

const TaskRoutes = Router({ mergeParams: true });

// All task routes require authentication and org context
TaskRoutes.use(authenticate, requireOrgContext);

// GET    /workspace/:workspaceId/channels/:channelId/tasks
// POST   /workspace/:workspaceId/channels/:channelId/tasks
TaskRoutes.get("/", TaskController.getTasks);
TaskRoutes.post("/", validate(createTaskSchema), TaskController.createTask);

// PATCH  /workspace/:workspaceId/channels/:channelId/tasks/:taskId
// DELETE /workspace/:workspaceId/channels/:channelId/tasks/:taskId
TaskRoutes.patch(
  "/:taskId",
  validate(updateTaskSchema),
  TaskController.updateTask,
);
TaskRoutes.delete("/:taskId", TaskController.deleteTask);

export default TaskRoutes;
