import { createContext, useContext, useState, type ReactNode } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";

interface TaskComposerContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const TaskComposerContext = createContext<TaskComposerContextValue | null>(
  null,
);

// Shares whether the add task dialog is open, so it can be opened from anywhere
export function TaskComposerProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <TaskComposerContext.Provider value={{ open, setOpen }}>
      {children}
    </TaskComposerContext.Provider>
  );
}

export function useTaskComposer() {
  const context = useContext(TaskComposerContext);
  if (!context) {
    throw new Error("useTaskComposer must be used within TaskComposerProvider");
  }
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // The dialog lives on the tasks page, so go there first if elsewhere
  function openComposer() {
    if (pathname !== "/") navigate({ to: "/" });
    context!.setOpen(true);
  }

  return { ...context, openComposer };
}
