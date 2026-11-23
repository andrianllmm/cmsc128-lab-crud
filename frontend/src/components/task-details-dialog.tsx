import { format } from "date-fns";
import type { UpdateTaskInput } from "@/schemas/tasks";
import type { ListUser } from "@/types/lists";
import type { Task } from "@/types/tasks";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { TaskForm } from "@/components/task-form";
import { UserAvatar } from "@/components/user-avatar";

interface TaskDetailsDialogProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (id: string, data: UpdateTaskInput) => Promise<boolean>;
  // In shared lists, shows who created the task
  showCreator?: boolean;
  members?: ListUser[];
}

/**
 * A task's full view; its fields can be edited and saved in place.
 * */
export function TaskDetailsDialog({
  task,
  open,
  onOpenChange,
  onEdit,
  showCreator,
  members,
}: TaskDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Extra top padding keeps the close button off the title */}
      <DialogContent className="gap-6 p-6 pt-10 sm:max-w-2xl">
        {/* The title field shows the title, so this is for screen readers */}
        <DialogTitle className="sr-only">{task.title}</DialogTitle>

        <TaskForm
          task={task}
          members={members}
          submitLabel="Save"
          titleClassName="h-10 text-xl font-semibold md:text-xl"
          onSubmit={async (data) => {
            const ok = await onEdit(task._id, data);
            if (ok) onOpenChange(false);
            return ok;
          }}
        />

        <DialogDescription className="flex items-center gap-1.5 border-t pt-4 text-xs">
          {showCreator && (
            <>
              <UserAvatar displayName={task.owner.displayName} size="xs" />
              {task.owner.displayName} ·{" "}
            </>
          )}
          Created {format(new Date(task.createdAt), "PP")}
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
}
