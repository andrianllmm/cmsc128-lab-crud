import { useRef } from "react";
import { cn } from "cn";
import { Input } from "@/components/ui/input";
import type { TaskMatch } from "@/lib/parse-task";

const MATCH_COLORS: Record<TaskMatch["kind"], string> = {
  date: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  tag: "bg-violet-500/15 text-violet-700 dark:text-violet-400",
  priority: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  assignee: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
};

interface HighlightedInputProps extends React.ComponentProps<"input"> {
  value: string;
  matches: TaskMatch[];
}

/**
 * An input that colors parsed keywords. Inputs can't style part of their
 * text, so the input's own text is made transparent and a copy with the
 * keywords wrapped in <mark> is drawn exactly on top of it.
 * */
export function HighlightedInput({
  value,
  matches,
  className,
  onScroll,
  ...props
}: HighlightedInputProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Split the text into plain and highlighted pieces, left to right
  const pieces = [];
  let cursor = 0;
  for (const match of matches) {
    pieces.push(value.slice(cursor, match.start));
    pieces.push(
      <mark
        key={match.start}
        className={cn("rounded-sm", MATCH_COLORS[match.kind])}
      >
        {value.slice(match.start, match.end)}
      </mark>,
    );
    cursor = match.end;
  }
  pieces.push(value.slice(cursor));

  return (
    <div className="relative">
      <Input
        value={value}
        className={cn("text-transparent caret-foreground", className)}
        // Keep the overlay aligned when a long title scrolls sideways
        onScroll={(e) => {
          if (overlayRef.current) {
            overlayRef.current.scrollLeft = e.currentTarget.scrollLeft;
          }
          onScroll?.(e);
        }}
        {...props}
      />
      {/* Same border, padding, and font as the input so the text lines up */}
      <div
        ref={overlayRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center overflow-hidden border border-transparent px-2.5 py-1 text-base whitespace-pre text-foreground md:text-sm"
      >
        {/* One inline wrapper, since flex drops whitespace-only text between marks */}
        <span>{pieces}</span>
      </div>
    </div>
  );
}
