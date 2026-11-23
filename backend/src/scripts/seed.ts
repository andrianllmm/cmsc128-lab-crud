/**
 * Adds sample tasks to the personal lists of already-registered users, and,
 * given two or more users, a shared list (first email owns it, the rest are members).
 * Usage: pnpm seed <email> [email...]
 *
 * Users must register through the app first; this never creates accounts.
 * A user whose personal list already has tasks is skipped, and so is an
 * existing shared list, so it's safe to rerun.
 * */
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { userService } from "../modules/users/users.service.js";
import { ListModel } from "../modules/lists/lists.model.js";
import { TaskModel } from "../modules/tasks/tasks.model.js";

const DAY_MS = 24 * 60 * 60 * 1000;

// Due dates are relative to now, so one task is always overdue
const daysFromNow = (days: number) => new Date(Date.now() + days * DAY_MS);

const SAMPLE_TASKS = [
  {
    title: "Finish CMSC 128 lab report",
    dueDate: daysFromNow(2),
    priority: "High",
    tag: "School",
  },
  {
    title: "Review for the long exam",
    dueDate: daysFromNow(5),
    priority: "Medium",
    tag: "School",
  },
  {
    title: "Submit weekly timesheet",
    dueDate: daysFromNow(-1),
    priority: "Low",
    tag: "Work",
  },
  { title: "Buy groceries", tag: "Personal" },
  { title: "Water the plants", done: true },
];

const SHARED_LIST_NAME = "CMSC 128 Group Project";

// assignee is an index into the users (0 = owner); omitted means unassigned
const SHARED_TASKS = [
  {
    title: "Design the database schema",
    assignee: 0,
    priority: "High",
    tag: "School",
    dueDate: daysFromNow(3),
  },
  {
    title: "Build the task list UI",
    assignee: 1,
    priority: "High",
    tag: "School",
    dueDate: daysFromNow(4),
  },
  {
    title: "Write API tests",
    assignee: 2,
    priority: "Medium",
    tag: "School",
    dueDate: daysFromNow(6),
  },
  {
    title: "Prepare the demo slides",
    assignee: 1,
    priority: "Low",
    tag: "School",
    dueDate: daysFromNow(-1),
  },
  { title: "Fix login redirect bug", assignee: 0, done: true, tag: "School" },
  { title: "Update the README", tag: "School" },
  { title: "Plan the presentation schedule" },
];

async function seedSharedList(emails: string[]) {
  if (emails.length < 2) return;

  const users: NonNullable<
    Awaited<ReturnType<typeof userService.findByEmail>>
  >[] = [];
  for (const email of emails) {
    const user = await userService.findByEmail(email.toLowerCase());
    if (!user) {
      console.log(`shared list: ${email} has no account, skipped`);
      return;
    }
    users.push(user);
  }
  const [owner, ...members] = users;
  if (!owner) return;

  if (
    await ListModel.exists({
      owner: owner._id,
      name: SHARED_LIST_NAME,
      personal: false,
    })
  ) {
    console.log(`shared list: "${SHARED_LIST_NAME}" already exists, skipped`);
    return;
  }

  const list = await ListModel.create({
    name: SHARED_LIST_NAME,
    owner: owner._id,
    members: members.map((m) => m._id),
  });
  await TaskModel.insertMany(
    SHARED_TASKS.map(({ assignee, ...task }) => {
      const assigned =
        assignee === undefined ? undefined : users[assignee % users.length];
      return {
        ...task,
        list: list._id,
        owner: owner._id,
        ...(assigned && { assignee: assigned._id }),
      };
    }),
  );
  console.log(
    `shared list: created "${SHARED_LIST_NAME}" with ${members.length} member(s) and ${SHARED_TASKS.length} tasks`,
  );
}

async function seedUser(email: string) {
  const user = await userService.findByEmail(email.toLowerCase());
  if (!user) {
    console.log(`${email}: no account, register it through the app first`);
    return;
  }

  const list = await ListModel.findOne({ owner: user._id, personal: true });
  if (!list) {
    console.log(`${email}: no personal list, re-register the account`);
    return;
  }

  if (await TaskModel.exists({ list: list._id })) {
    console.log(`${email}: already has tasks, skipped`);
    return;
  }

  await TaskModel.insertMany(
    SAMPLE_TASKS.map((task) => ({ ...task, list: list._id, owner: user._id })),
  );
  console.log(`${email}: added ${SAMPLE_TASKS.length} tasks`);
}

async function main() {
  const emails = process.argv.slice(2);
  if (emails.length === 0) {
    console.error("Usage: pnpm seed <email> [email...]");
    process.exitCode = 1;
    return;
  }

  await connectDB();
  try {
    for (const email of emails) await seedUser(email);
    await seedSharedList(emails);
  } finally {
    await mongoose.disconnect();
  }
}

main();
