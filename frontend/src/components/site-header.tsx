import { Link, useRouterState } from "@tanstack/react-router";
import { ListTodoIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="mx-auto flex h-12 max-w-xl items-center justify-between gap-2 px-4 sm:px-6">
        {/* App title */}
        <h1>
          {/* Styled like a button, but it navigates, so it's a link for screen readers */}
          <Link
            to="/"
            className={buttonVariants({
              variant: "ghost",
              className: "-ml-2.5 text-base font-semibold",
            })}
          >
            <ListTodoIcon aria-hidden />
            TODO
          </Link>
        </h1>

        <HeaderActions />
      </div>
    </header>
  );
}

function HeaderActions() {
  const { loading } = useAuth();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  // Placeholder while the user loads
  if (loading) return <Skeleton className="h-7 w-16" />;

  // On the login page, offer the other way in instead of a link to the same page
  const onLogin = pathname === "/login";

  return (
    <Link
      to={onLogin ? "/register" : "/login"}
      className={buttonVariants({ variant: "outline", size: "sm" })}
    >
      {onLogin ? "Create account" : "Log in"}
    </Link>
  );
}
