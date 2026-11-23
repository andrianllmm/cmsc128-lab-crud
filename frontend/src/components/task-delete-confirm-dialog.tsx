import { TrashIcon } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface TaskDeleteConfirmDialogProps {
  taskTitle: string;
  onConfirm: () => void;
  className?: string;
}

export function TaskDeleteConfirmDialog({
  taskTitle,
  onConfirm,
  className,
}: TaskDeleteConfirmDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className={cn("hover:text-destructive", className)}
            aria-label={`Delete "${taskTitle}"`}
          />
        }
      >
        <TrashIcon />
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="min-w-0 wrap-anywhere">
            Delete "{taskTitle}"?
          </AlertDialogTitle>
          <AlertDialogDescription>
            You can undo this for a few seconds after deleting.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
