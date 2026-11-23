import { createFileRoute } from "@tanstack/react-router";
import { TaskList } from "@/components/task-list";
import { TaskToolbar } from "@/components/task-toolbar";
import { TaskForm } from "@/components/task-form";
import { listsQueryOptions, useLists } from "@/hooks/useLists";
import { useTasks } from "@/hooks/useTasks";
import { useTaskView } from "@/hooks/useTaskView";
import { requireAuth } from "@/lib/auth";
import type { Task } from "@/types/tasks";
import { pageHead } from "@/lib/title";

export const Route = createFileRoute("/")({
  head: pageHead("Tasks"),
  // The selected list, kept in the URL so it survives refreshes
  validateSearch: (search): { list?: string } => ({
    list: typeof search.list === "string" ? search.list : undefined,
  }),
  beforeLoad: requireAuth,
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(listsQueryOptions),
  component: TasksPage,
});

function TasksPage() {
  const search = Route.useSearch();
  const { lists } = useLists();
  // Falls back to the personal list, which comes first, if the selected one isn't accessible
  const list = lists.find((l) => l._id === search.list) ?? lists[0];
  const listId = list._id;

  const { tasks, loading, error, retry, createTask, updateTask, deleteTask } =
    useTasks(listId);
  const {
    visibleTasks,
    sortBy,
    sortDir,
    setSortBy,
    toggleSortDir,
    filters,
    updateFilters,
    resetFilters,
    hasActiveFilters,
  } = useTaskView(tasks);
  const todoCount = countTodos(tasks);
  // Tasks in shared lists can be assigned to anyone in the list
  const members = list.personal ? undefined : [list.owner, ...list.members];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 pb-24 sm:px-8">
      <h1 className="truncate text-2xl font-bold">{list.name}</h1>

      <TaskForm members={members} onSubmit={createTask} />

      <section aria-labelledby="tasks-heading" className="flex flex-col gap-4">
        {/* Count of not done tasks; shows the total too when filtered */}
        {!loading && !error && (
          <h2 id="tasks-heading" className="text-sm font-medium">
            {hasActiveFilters && `${countTodos(visibleTasks)} of `}
            {todoCount} {todoCount === 1 ? "TODO" : "TODOs"}
          </h2>
        )}

        <TaskToolbar
          sortBy={sortBy}
          sortDir={sortDir}
          setSortBy={setSortBy}
          toggleSortDir={toggleSortDir}
          filters={filters}
          updateFilters={updateFilters}
          resetFilters={resetFilters}
          hasActiveFilters={hasActiveFilters}
        />

        <TaskList
          tasks={visibleTasks}
          loading={loading}
          error={error}
          hasActiveFilters={hasActiveFilters}
          onResetFilters={resetFilters}
          onRetry={retry}
          onEdit={updateTask}
          onDelete={deleteTask}
          showCreator={!list.personal}
          members={members}
        />
      </section>
    </div>
  );
}

function countTodos(tasks: Task[]) {
  return tasks.filter((t) => !t.done).length;
}
