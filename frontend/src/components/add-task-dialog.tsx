import { PlusIcon } from "lucide-react";
import type { CreateTaskInput } from "@/schemas/tasks";
import type { ListUser } from "@/types/lists";
import { useTaskComposer } from "@/hooks/useTaskComposer";
import { useHotkey } from "@/hooks/useHotkey";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { TaskForm } from "@/components/task-form";

interface AddTaskDialogProps {
  members?: ListUser[];
  onSubmit: (data: CreateTaskInput) => Promise<boolean>;
}

export function AddTaskDialog({ members, onSubmit }: AddTaskDialogProps) {
  const { open, setOpen } = useTaskComposer();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* Near the top on phones so the keyboard doesn't cover it */}
      <DialogContent
        showCloseButton={false}
        className="top-4 translate-y-0 p-3 sm:top-1/2 sm:max-w-xl sm:-translate-y-1/2"
      >
        <DialogTitle className="sr-only">Add task</DialogTitle>
        <TaskForm
          members={members}
          submitLabel="Add task"
          onCancel={() => setOpen(false)}
          onSubmit={async (data) => {
            const ok = await onSubmit(data);
            if (ok) setOpen(false);
            return ok;
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

// Always-visible button for adding a task; also opens with Q
export function AddTaskFab() {
  const { openComposer } = useTaskComposer();
  useHotkey("q", openComposer);

  return (
    <Button
      size="icon-lg"
      aria-label="Add task"
      title="Add task (Q)"
      aria-keyshortcuts="Q"
      onClick={openComposer}
      className="fixed right-6 bottom-6 z-20 size-12 rounded-full shadow-lg"
    >
      <PlusIcon className="size-6" />
    </Button>
  );
}
