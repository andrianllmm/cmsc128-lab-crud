import { HashIcon } from "lucide-react";
import { cn } from "cn";
import type { Tag } from "@/types/tasks";

const TAG_COLORS: Record<Tag, string> = {
  Work: "text-sky-600 dark:text-sky-400",
  School: "text-violet-600 dark:text-violet-400",
  Personal: "text-emerald-600 dark:text-emerald-400",
  Others: "text-muted-foreground",
};

interface TagBadgeProps extends React.ComponentProps<"span"> {
  tag: Tag;
}

// A colored "# Tag" label
function TagBadge({ tag, className, ...props }: TagBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5",
        TAG_COLORS[tag],
        className,
      )}
      {...props}
    >
      <HashIcon className="size-3.5" aria-hidden />
      {tag}
    </span>
  );
}

export { TagBadge };
