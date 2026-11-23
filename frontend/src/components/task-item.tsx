import { useState } from "react";
import { isPast } from "date-fns";
import { formatDueDate } from "@/lib/dates";
import type { UpdateTaskInput } from "@/schemas/tasks";
import type { ListUser } from "@/types/lists";
import type { Task } from "@/types/tasks";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
      <Card className="relative transition-colors hover:bg-muted/50">
        <CardHeader>
          <div className="flex min-w-0 items-center gap-2">
            {/* Toggle mark as done */}
            <Checkbox
              aria-label={task.done ? "Mark as not done" : "Mark as done"}
              checked={task.done}
              disabled={toggling}
              onCheckedChange={(checked) => toggleDone(checked === true)}
              className="relative z-10"
            />

            {/* Title; its overlay makes the whole card open the edit dialog */}
            <CardTitle
              className={cn(
                "min-w-0 wrap-anywhere",
                task.done && "text-muted-foreground line-through",
              )}
            >
              <button
                type="button"
                aria-haspopup="dialog"
                onClick={() => setOpen(true)}
                className="cursor-pointer text-left outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-2 focus-visible:after:ring-ring/50"
              >
                {task.title}
              </button>
            </CardTitle>
          </div>

          {/* Delete button */}
          <CardAction className="relative z-10 flex items-center gap-1">
            <TaskDeleteConfirmDialog
              taskTitle={task.title}
              onConfirm={() => onDelete(task._id)}
            />
          </CardAction>
        </CardHeader>

        {/* Hidden when there's no details to show */}
        <CardContent className="flex flex-wrap items-center gap-2 empty:hidden">
          {/* Due date */}
          {task.dueDate && (
            <span
              className={cn(
                "text-sm text-muted-foreground",
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
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <UserAvatar displayName={task.assignee.displayName} size="sm" />
              {task.assignee.displayName}
            </span>
          )}
        </CardContent>
      </Card>

      {/* Edit task dialog; kept outside the card so the delete dialog isn't nested in it */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl">
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
