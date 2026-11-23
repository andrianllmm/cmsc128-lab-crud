import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  SearchIcon,
  XIcon,
} from "lucide-react";
import {
  SORT_OPTIONS,
  type SortBy,
  type SortDir,
  type Filters,
} from "@/hooks/useTaskView";
import { PRIORITIES, TAGS } from "@/types/tasks";
import type { ListUser } from "@/types/lists";
import { UserAvatar } from "@/components/user-avatar";
import { PriorityBadge } from "@/components/priority-badge";
import { TagBadge } from "@/components/tag-badge";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SORT_LABELS: Record<SortBy, string> = {
  createdAt: "Date added",
  dueDate: "Due date",
  priority: "Priority",
  tag: "Tag",
};

interface TaskToolbarProps {
  sortBy: SortBy;
  sortDir: SortDir;
  setSortBy: (sortBy: SortBy) => void;
  toggleSortDir: () => void;

  filters: Filters;
  updateFilters: <K extends keyof Filters>(field: K, value: Filters[K]) => void;
  resetFilters: () => void;
  hasActiveFilters: boolean;
  // Who tasks can be assigned to; omitted in personal lists
  members?: ListUser[];
}

export function TaskToolbar({
  sortBy,
  sortDir,
  setSortBy,
  toggleSortDir,
  filters,
  updateFilters,
  resetFilters,
  hasActiveFilters,
  members,
}: TaskToolbarProps) {
  return (
    <div className="flex flex-row flex-wrap items-center justify-between gap-2">
      {/* Sorting */}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Sort"
              title="Sort"
            />
          }
        >
          <ArrowUpDownIcon />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-44">
          {/* Sort by option */}
          <DropdownMenuGroup>
            <DropdownMenuLabel>Sort by</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={sortBy}
              onValueChange={(v) => setSortBy(v as SortBy)}
            >
              {SORT_OPTIONS.map((option) => (
                <DropdownMenuRadioItem key={option} value={option}>
                  {SORT_LABELS[option]}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          {/* Sort direction */}
          <DropdownMenuRadioGroup
            value={sortDir}
            onValueChange={(v) => v !== sortDir && toggleSortDir()}
          >
            <DropdownMenuRadioItem value="asc">
              <ArrowUpIcon />
              Ascending
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="desc">
              <ArrowDownIcon />
              Descending
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Search by title; fills the space between sorting and filters */}
      <InputGroup className="min-w-40 flex-1">
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput
          type="search"
          aria-label="Search tasks"
          placeholder="Search"
          value={filters.search}
          onChange={(e) => updateFilters("search", e.target.value)}
        />
      </InputGroup>

      {/* Filtering */}
      <div className="flex flex-row items-center gap-1">
        {/* Filter by tag */}
        <Select
          value={filters.tag}
          onValueChange={(v) => v && updateFilters("tag", v as Filters["tag"])}
        >
          <SelectTrigger
            aria-label="Filter by tag"
            className="border-0 dark:bg-transparent"
          >
            <SelectValue placeholder="Tag">
              {(v: Filters["tag"] | null) =>
                v && v !== "All" ? <TagBadge tag={v} /> : "All tags"
              }
            </SelectValue>
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="All">All tags</SelectItem>
            {TAGS.map((tag) => (
              <SelectItem key={tag} value={tag}>
                <TagBadge tag={tag} />
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filter by priority */}
        <Select
          value={filters.priority}
          onValueChange={(v) =>
            v && updateFilters("priority", v as Filters["priority"])
          }
        >
          <SelectTrigger
            aria-label="Filter by priority"
            className="border-0 dark:bg-transparent"
          >
            <SelectValue placeholder="Priority">
              {(v: Filters["priority"] | null) =>
                v && v !== "All" ? (
                  <PriorityBadge priority={v} />
                ) : (
                  "All priorities"
                )
              }
            </SelectValue>
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="All">All priorities</SelectItem>
            {PRIORITIES.map((priority) => (
              <SelectItem key={priority} value={priority}>
                <PriorityBadge priority={priority} />
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filter by assignee; only shared lists have assignees */}
        {members && (
          <Select
            value={filters.assignee}
            onValueChange={(v) => v && updateFilters("assignee", v)}
          >
            <SelectTrigger
              aria-label="Filter by assignee"
              className="border-0 dark:bg-transparent"
            >
              <SelectValue placeholder="Assignee">
                {(v: string | null) => {
                  if (v === "Unassigned") return "Unassigned";
                  const member = members.find((m) => m._id === v);
                  return member ? <Member member={member} /> : "All assignees";
                }}
              </SelectValue>
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="All">All assignees</SelectItem>
              <SelectItem value="Unassigned">Unassigned</SelectItem>
              {members.map((m) => (
                <SelectItem key={m._id} value={m._id}>
                  <Member member={m} />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {hasActiveFilters && (
          // Reset filters
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Clear filters"
            onClick={resetFilters}
          >
            <XIcon />
          </Button>
        )}
      </div>
    </div>
  );
}

function Member({ member }: { member: ListUser }) {
  return (
    <span className="flex min-w-0 items-center gap-1">
      <UserAvatar displayName={member.displayName} size="xs" />
      <span className="truncate">{member.displayName}</span>
    </span>
  );
}
