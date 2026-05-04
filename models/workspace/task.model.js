export const TaskModel = (sequelize, DataTypes, options = {}) => {
  const modelName = options.modelSuffix ? `Task${options.modelSuffix}` : "Task";

  const Task = sequelize.define(
    modelName,
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      channel_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      workspace_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      // Optional link back to the meeting that generated this task (AI source)
      meeting_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      title: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      // todo | in_progress | done
      status: {
        type: DataTypes.ENUM("todo", "in_progress", "done"),
        allowNull: false,
        defaultValue: "todo",
      },
      // low | medium | high
      priority: {
        type: DataTypes.ENUM("low", "medium", "high"),
        allowNull: false,
        defaultValue: "medium",
      },
      // Who the task is assigned to (workspace member)
      assigned_to_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      // Who created this task
      created_by_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      due_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      // "manual" = created by a user | "ai" = extracted from meeting by AI pipeline
      source: {
        type: DataTypes.ENUM("manual", "ai"),
        allowNull: false,
        defaultValue: "manual",
      },
    },
    {
      tableName: "tasks",
      schema: options.schema,
      timestamps: true,
      underscored: true,
      indexes: [
        { fields: ["channel_id"] },
        { fields: ["workspace_id"] },
        { fields: ["assigned_to_id"] },
        { fields: ["status"] },
      ],
    },
  );

  return Task;
};

export default TaskModel;
