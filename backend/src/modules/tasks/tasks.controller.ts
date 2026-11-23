import type { Request, Response } from "express";

import { taskService } from "./tasks.service.js";
import type { ListAccess } from "../lists/lists.model.js";
import type { ListIdInput } from "../lists/lists.schema.js";
import type {
  TaskIdInput,
  CreateTaskInput,
  UpdateTaskInput,
} from "./tasks.schema.js";

// Task routes are nested under a list, so their params include `listId`
type TaskParams = ListIdInput & TaskIdInput;

/**
 * Whether the assignee (if any) is the list's owner or a member.
 * Anyone else would see the task's title by being assigned, so it's rejected.
 * */
const isAssignable = (list: ListAccess, assignee?: string | null) =>
  !assignee ||
  list.owner.equals(assignee) ||
  list.members.some((id) => id.equals(assignee));

const notAssignable = { message: "Assignee must be a member of the list" };

const getTasks = async (req: Request<ListIdInput>, res: Response) => {
  const tasks = await taskService.getTasks(req.params.listId);
  res.json(tasks);
};

const getTaskById = async (req: Request<TaskParams>, res: Response) => {
  const task = await taskService.getTaskById(req.params.listId, req.params.id);

  if (!task) {
    return res.status(404).json({ message: "Task not found" });
  }

  res.json(task);
};

const createTask = async (
  req: Request<ListIdInput, unknown, CreateTaskInput>,
  res: Response,
) => {
  if (!isAssignable(res.locals.list, req.body.assignee)) {
    return res.status(400).json(notAssignable);
  }

  const task = await taskService.createTask(
    req.params.listId,
    req.session.userId!,
    req.body,
  );
  res.status(201).json(task);
};

const updateTask = async (
  req: Request<TaskParams, unknown, UpdateTaskInput>,
  res: Response,
) => {
  if (!isAssignable(res.locals.list, req.body.assignee)) {
    return res.status(400).json(notAssignable);
  }

  const task = await taskService.updateTask(
    req.params.listId,
    req.params.id,
    req.body,
  );

  if (!task) {
    return res.status(404).json({ message: "Task not found" });
  }

  res.json(task);
};

const deleteTask = async (req: Request<TaskParams>, res: Response) => {
  const task = await taskService.deleteTask(req.params.listId, req.params.id);

  if (!task) {
    return res.status(404).json({ message: "Task not found" });
  }

  res.json(task);
};

export const taskController = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
};
