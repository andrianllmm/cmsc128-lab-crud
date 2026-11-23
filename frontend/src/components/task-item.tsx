import { useState } from "react";
import { isPast } from "date-fns";
import { formatDueDate } from "@/lib/dates";
import type { UpdateTaskInput } from "@/schemas/tasks";
import type { ListUser } from "@/types/lists";
import type { Task } from "@/types/tasks";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { PriorityBadge } from "@/components/priority-badge";
import { TagBadge } from "@/components/tag-badge";
import { TaskForm } from "@/components/task-form";
import { TaskDeleteConfirmDialog } from "@/components/task-delete-confirm-dialog";
import { UserAvatar } from "@/components/user-avatar";
import { cn } from "cn";

interface TaskItemProps {
  task: Task;
  onEdit: (id: string, data: UpdateTaskInput) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  // In shared lists, shows who created the task
  showCreator?: boolean;
  // Who the task can be assigned to; omitted in personal lists
  members?: ListUser[];
}

export function TaskItem({
  task,
  onEdit,
  onDelete,
  showCreator,
  members,
}: TaskItemProps) {
  const [open, setOpen] = useState(false);
  // Disables the checkbox while its update is saving
  const [toggling, setToggling] = useState(false);

  async function toggleDone(done: boolean) {
    setToggling(true);
    await onEdit(task._id, { done });
    setToggling(false);
  }

  return (
    <>
      <div className="group relative flex items-start gap-3 border-b py-3">
        {/* Toggle mark as done */}
        <Checkbox
          aria-label={task.done ? "Mark as not done" : "Mark as done"}
          checked={task.done}
          disabled={toggling}
          onCheckedChange={(checked) => toggleDone(checked === true)}
          className="relative z-10 mt-0.5 size-4.5 rounded-full"
        />

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          {/* Title; its overlay makes the whole row open the edit dialog */}
          <button
            type="button"
            aria-haspopup="dialog"
            onClick={() => setOpen(true)}
            className={cn(
              "min-w-0 cursor-pointer text-left text-sm wrap-anywhere outline-none after:absolute after:inset-0 after:rounded-lg focus-visible:after:ring-2 focus-visible:after:ring-ring/50",
              task.done && "text-muted-foreground line-through",
            )}
          >
            {task.title}
          </button>

          {/* Hidden when there's no details to show */}
          <div className="flex flex-wrap items-center gap-2 text-xs empty:hidden">
            {/* Due date */}
            {task.dueDate && (
              <span
                className={cn(
                  "text-muted-foreground",
                  // Overdue if past due and not done
                  !task.done &&
                    isPast(new Date(task.dueDate)) &&
                    "text-destructive",
                )}
              >
                {formatDueDate(new Date(task.dueDate))}
              </span>
            )}

            {/* Priority; hidden if default */}
            {task.priority !== "None" && (
              <PriorityBadge priority={task.priority} />
            )}

            {/* Tag; hidden if default */}
            {task.tag !== "Others" && <TagBadge tag={task.tag} />}

            {/* Assignee */}
            {task.assignee && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <UserAvatar displayName={task.assignee.displayName} size="xs" />
                {task.assignee.displayName}
              </span>
            )}
          </div>
        </div>

        {/* Delete button; shown on hover where there's a pointer */}
        <TaskDeleteConfirmDialog
          taskTitle={task.title}
          onConfirm={() => onDelete(task._id)}
          className="relative z-10 -my-1 group-focus-within:opacity-100 group-hover:opacity-100 md:opacity-0"
        />
      </div>

      {/* Edit task dialog; kept outside the row so the delete dialog isn't nested in it */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent showCloseButton={false} className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit task</DialogTitle>
            {showCreator && (
              <DialogDescription className="flex items-center gap-2">
                <UserAvatar displayName={task.owner.displayName} size="sm" />
                Created by {task.owner.displayName}
              </DialogDescription>
            )}
          </DialogHeader>

          <TaskForm
            task={task}
            members={members}
            submitLabel="Save"
            onCancel={() => setOpen(false)}
            onSubmit={async (data) => {
              const ok = await onEdit(task._id, data);
              if (ok) setOpen(false);
              return ok;
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
