import { useState } from "react";
import {
  EllipsisIcon,
  Loader2Icon,
  PencilIcon,
  TrashIcon,
  UsersIcon,
} from "lucide-react";
import type { AddMemberInput, CreateListInput } from "@/schemas/lists";
import type { List } from "@/types/lists";
import { SidebarMenuAction } from "@/components/ui/sidebar";
import { ListNameForm } from "@/components/list-name-form";
import { ListMembersDialog } from "@/components/list-members-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ListActionsMenuProps {
  list: List;
  isOwner: boolean;
  onAddMember: (data: AddMemberInput) => Promise<void>;
  onRename: (data: CreateListInput) => Promise<boolean>;
  onDelete: () => Promise<unknown>;
}

/**
 * Members, rename, and delete actions for a shared list.
 * Only the owner can rename or delete.
 * */
export function ListActionsMenu({
  list,
  isOwner,
  onAddMember,
  onRename,
  onDelete,
}: ListActionsMenuProps) {
  const [viewingMembers, setViewingMembers] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  // Keeps the confirmation open and disabled until the delete finishes
  const [deletePending, setDeletePending] = useState(false);

  async function handleDelete() {
    setDeletePending(true);
    await onDelete();
    setDeletePending(false);
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <SidebarMenuAction
              showOnHover
              aria-label="List options"
              title="List options"
            />
          }
        >
          <EllipsisIcon />
        </DropdownMenuTrigger>

        <DropdownMenuContent side="right" align="start">
          <DropdownMenuItem onClick={() => setViewingMembers(true)}>
            <UsersIcon />
            Members
          </DropdownMenuItem>
          {isOwner && (
            <>
              <DropdownMenuItem onClick={() => setRenaming(true)}>
                <PencilIcon />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setDeleting(true)}
              >
                <TrashIcon />
                Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ListMembersDialog
        list={list}
        isOwner={isOwner}
        open={viewingMembers}
        onOpenChange={setViewingMembers}
        onAddMember={onAddMember}
      />

      {/* Rename dialog */}
      <Dialog open={renaming} onOpenChange={setRenaming}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename list</DialogTitle>
          </DialogHeader>
          <ListNameForm
            name={list.name}
            submitLabel="Save"
            onSubmit={async (data) => {
              const ok = await onRename(data);
              if (ok) setRenaming(false);
              return ok;
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleting} onOpenChange={setDeleting}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="min-w-0 wrap-anywhere">
              Delete "{list.name}"?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Its tasks are deleted too, for every member. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletePending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDelete}
              disabled={deletePending}
            >
              {deletePending && <Loader2Icon className="animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
