import { Suspense } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { CirclePlusIcon, HashIcon, InboxIcon } from "lucide-react";
import { useLists } from "@/hooks/useLists";
import { useTaskComposer } from "@/hooks/useTaskComposer";
import type { CreateListInput } from "@/schemas/lists";
import type { List } from "@/types/lists";
import type { User } from "@/types/users";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  useSidebar,
} from "@/components/ui/sidebar";
import { Kbd } from "@/components/ui/kbd";
import { UserMenu } from "@/components/user-menu";
import { NewListDialog } from "@/components/new-list-dialog";
import { ListActionsMenu } from "@/components/list-actions-menu";

export function AppSidebar({ user }: { user: User }) {
  const { openComposer } = useTaskComposer();
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <UserMenu user={user} />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                className="font-medium text-primary hover:text-primary"
                onClick={() => {
                  // The mobile sidebar is a sheet that would cover the dialog
                  if (isMobile) setOpenMobile(false);
                  openComposer();
                }}
              >
                <CirclePlusIcon />
                Add task
                <Kbd className="ml-auto">Q</Kbd>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* Lists may still be loading on pages other than the tasks page */}
        <Suspense fallback={<ListsSkeleton />}>
          <ListsGroup userId={user._id} />
        </Suspense>
      </SidebarContent>
    </Sidebar>
  );
}

function ListsGroup({ userId }: { userId: string }) {
  const { lists, createList, addMember, renameList, deleteList } = useLists();
  const navigate = useNavigate();
  const { isMobile, setOpenMobile } = useSidebar();
  const location = useRouterState({ select: (s) => s.location });

  // Highlight the shown list; falls back to the personal list, like the tasks page
  const search = location.search as { list?: string };
  const activeId =
    location.pathname === "/"
      ? (lists.find((l) => l._id === search.list) ?? lists[0])?._id
      : undefined;

  // Switches to the new list once created
  async function handleCreate(data: CreateListInput) {
    const created = await createList(data);
    if (created) navigate({ to: "/", search: { list: created._id } });
    return !!created;
  }

  // Goes back to the personal list once the shown list is deleted
  async function handleDelete(listId: string) {
    if ((await deleteList(listId)) && listId === activeId) {
      navigate({ to: "/", search: {} });
    }
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>My lists</SidebarGroupLabel>
      <NewListDialog onSubmit={handleCreate} />
      <SidebarGroupContent>
        <SidebarMenu>
          {lists.map((list) => (
            <SidebarMenuItem key={list._id}>
              <SidebarMenuButton
                isActive={list._id === activeId}
                render={<Link to="/" search={{ list: list._id }} />}
                onClick={() => isMobile && setOpenMobile(false)}
              >
                {list.personal ? <InboxIcon /> : <HashIcon />}
                <span>{listLabel(list, userId)}</span>
              </SidebarMenuButton>

              {/* Personal lists can't be shared, renamed, or deleted */}
              {!list.personal && (
                <ListActionsMenu
                  list={list}
                  isOwner={list.owner._id === userId}
                  onAddMember={(data) => addMember(list._id, data)}
                  onRename={(data) => renameList(list._id, data)}
                  onDelete={() => handleDelete(list._id)}
                />
              )}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function ListsSkeleton() {
  return (
    <SidebarGroup>
      <SidebarMenu>
        {Array.from({ length: 3 }).map((_, i) => (
          <SidebarMenuItem key={i}>
            <SidebarMenuSkeleton showIcon />
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}

// Lists shared with the user also show who owns them
function listLabel(list: List, userId: string) {
  return list.owner._id === userId
    ? list.name
    : `${list.name} · ${list.owner.displayName}`;
}
