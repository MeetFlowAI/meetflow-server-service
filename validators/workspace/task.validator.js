/**
 * validators/workspace/task.validator.js
 */

export const createTaskSchema = {
  title: {
    required: true,
    type: "string",
    minLength: 1,
    maxLength: 500,
  },
  description: {
    required: false,
    type: "string",
    maxLength: 5000,
  },
  priority: {
    required: false,
    type: "string",
    isEnum: ["low", "medium", "high"],
  },
};

export const updateTaskSchema = {
  title: {
    required: false,
    type: "string",
    minLength: 1,
    maxLength: 500,
  },
  description: {
    required: false,
    type: "string",
    maxLength: 5000,
  },
  status: {
    required: false,
    type: "string",
    isEnum: ["todo", "in_progress", "done"],
  },
  priority: {
    required: false,
    type: "string",
    isEnum: ["low", "medium", "high"],
  },
};
