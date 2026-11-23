import {
  HeadContent,
  Outlet,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { ErrorPage } from "@/components/error-page";
import { NotFoundPage } from "@/components/not-found-page";
import { SiteHeader } from "@/components/site-header";
import { Toaster } from "@/components/ui/sonner";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AddTaskFab } from "@/components/add-task-dialog";
import { useAuth } from "@/hooks/useAuth";
import { TaskComposerProvider } from "@/hooks/useTaskComposer";
import type { User } from "@/types/users";

// Available to every route's `beforeLoad`/`loader` (e.g. auth guards)
interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  // Rendered inside the layout, so the header stays for navigation
  notFoundComponent: NotFoundPage,
  errorComponent: ErrorPage,
});

function RootLayout() {
  const { user } = useAuth();

  return (
    <>
      {/* Applies each route's `head`, e.g. the page title */}
      <HeadContent />
      {/* Lets keyboard users jump past the navigation; only visible when focused */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:ring-3 focus:ring-ring/50"
      >
        Skip to content
      </a>
      {user ? <AppLayout user={user} /> : <GuestLayout />}
      <Toaster />
      <TanStackRouterDevtools position="bottom-left" />
    </>
  );
}

// Logged in: lists and account live in the sidebar
function AppLayout({ user }: { user: User }) {
  return (
    <TaskComposerProvider>
      <SidebarProvider>
        <AppSidebar user={user} />
        <SidebarInset id="main" tabIndex={-1} className="outline-none">
          <header className="sticky top-0 z-10 flex h-12 items-center bg-background px-2">
            <SidebarTrigger />
          </header>
          <Outlet />
          <AddTaskFab />
        </SidebarInset>
      </SidebarProvider>
    </TaskComposerProvider>
  );
}

function GuestLayout() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <SiteHeader />
      {/* Fills the space below the header */}
      <main
        id="main"
        tabIndex={-1}
        className="flex flex-1 flex-col outline-none"
      >
        <Outlet />
      </main>
    </div>
  );
}
