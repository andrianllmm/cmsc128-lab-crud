import { TaskModel, type Task } from "./tasks.model.js";
import type { CreateTaskInput, UpdateTaskInput } from "./tasks.schema.js";

// Every query filters by `list`, which `requireListAccess` already checked the user can access.
// A task in another list is treated as not found.

// Reads use `.lean()`: responses only need plain JSON, not full Mongoose documents

// Shows who created and who is assigned each task in shared lists
const withUsers = [
  { path: "owner", select: "displayName" },
  { path: "assignee", select: "displayName" },
];

const getTasks = async (listId: string): Promise<Task[]> => {
  // Oldest first, so the default order is stable
  return TaskModel.find({ list: listId })
    .sort({ createdAt: 1 })
    .populate(withUsers)
    .lean();
};

const getTaskById = async (
  listId: string,
  id: string,
): Promise<Task | null> => {
  return TaskModel.findOne({ _id: id, list: listId })
    .populate(withUsers)
    .lean();
};

const createTask = async (
  listId: string,
  ownerId: string,
  data: CreateTaskInput,
): Promise<Task> => {
  const task = await TaskModel.create({
    ...data,
    list: listId,
    owner: ownerId,
  });
  return task.populate(withUsers);
};

const updateTask = async (
  listId: string,
  id: string,
  data: UpdateTaskInput,
): Promise<Task | null> => {
  return TaskModel.findOneAndUpdate({ _id: id, list: listId }, data, {
    returnDocument: "after",
    runValidators: true,
  })
    .populate(withUsers)
    .lean();
};

const deleteTask = async (listId: string, id: string): Promise<Task | null> => {
  return TaskModel.findOneAndDelete({ _id: id, list: listId }).lean();
};

export const taskService = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
};
