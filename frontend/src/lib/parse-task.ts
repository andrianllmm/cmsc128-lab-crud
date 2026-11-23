import * as chrono from "chrono-node";
import { endOfDay } from "date-fns";
import { PRIORITIES, TAGS, type Priority, type Tag } from "@/types/tasks";

export interface TaskMatch {
  kind: "date" | "tag" | "priority";
  start: number;
  end: number;
  // Lowercased matched text, so a dismissal can be matched against it
  text: string;
}

export interface ParsedTask {
  title: string;
  dueDate?: Date;
  priority?: Priority;
  tag?: Tag;
  // Where each keyword sits in the original text, for highlighting
  matches: TaskMatch[];
}

/**
 * Finds the first `<symbol><word>` whose word is one of `options`,
 * ignoring case, e.g. "#personal" for tags.
 * */
function findOption<T extends string>(
  text: string,
  symbol: "#" | "!",
  options: readonly T[],
  dismissed: ReadonlySet<string>,
) {
  // A symbol followed by one or more letters, digits, or underscores,
  // e.g. "#work" or "!high"; "g" finds every occurrence
  const pattern = new RegExp(`\\${symbol}(\\w+)`, "g");

  for (const match of text.matchAll(pattern)) {
    const value = options.find(
      (option) => option.toLowerCase() === match[1].toLowerCase(),
    );
    if (value && !dismissed.has(match[0].toLowerCase())) {
      return { value, start: match.index, end: match.index + match[0].length };
    }
  }
}

/** A found keyword's position plus its lowercased text. */
function range(text: string, { start, end }: { start: number; end: number }) {
  return { start, end, text: text.slice(start, end).toLowerCase() };
}

/**
 * Parses input like "Buy milk tomorrow 5pm #personal !high" into a title,
 * due date, tag, and priority. Unrecognized keywords, and ones in `dismissed`
 * (lowercased text the user turned back into plain text), stay in the title.
 * */
export function parseTaskInput(
  text: string,
  dismissed: ReadonlySet<string> = new Set(),
): ParsedTask {
  const matches: TaskMatch[] = [];
  let dueDate: Date | undefined;

  // forwardDate makes "friday" mean the coming friday, not the last one
  const date = chrono
    .parse(text, new Date(), { forwardDate: true })
    .find((result) => !dismissed.has(result.text.toLowerCase()));
  if (date) {
    // Date-only due dates are stored as the end of their day
    dueDate = date.start.isCertain("hour")
      ? date.start.date()
      : endOfDay(date.start.date());
    matches.push({
      kind: "date",
      start: date.index,
      end: date.index + date.text.length,
      text: date.text.toLowerCase(),
    });
  }

  const tag = findOption(text, "#", TAGS, dismissed);
  if (tag) matches.push({ kind: "tag", ...range(text, tag) });

  const priority = findOption(text, "!", PRIORITIES, dismissed);
  if (priority) matches.push({ kind: "priority", ...range(text, priority) });

  // Sort so the title and highlights can be built left to right
  matches.sort((a, b) => a.start - b.start);

  // Cut out every keyword, then collapse the leftover runs of whitespace
  let title = "";
  let cursor = 0;
  for (const match of matches) {
    title += text.slice(cursor, match.start);
    cursor = match.end;
  }
  title = (title + text.slice(cursor)).replace(/\s+/g, " ").trim();

  return {
    title,
    dueDate,
    priority: priority?.value,
    tag: tag?.value,
    matches,
  };
}
