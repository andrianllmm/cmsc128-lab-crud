import { FlagIcon } from "lucide-react";
import { cn } from "cn";
import type { Priority } from "@/types/tasks";

const FLAG_COLORS: Record<Priority, string> = {
  High: "fill-red-500 text-red-500",
  Medium: "fill-orange-500 text-orange-500",
  Low: "fill-blue-500 text-blue-500",
  None: "text-muted-foreground",
};

interface PriorityBadgeProps extends React.ComponentProps<"span"> {
  priority: Priority;
}

// A colored flag with the priority's name
function PriorityBadge({ priority, className, ...props }: PriorityBadgeProps) {
  return (
    <span
      className={cn("inline-flex items-center gap-1", className)}
      {...props}
    >
      <FlagIcon className={cn("size-3.5", FLAG_COLORS[priority])} aria-hidden />
      {priority}
    </span>
  );
}

export { PriorityBadge };
