import * as chrono from "chrono-node";
import { endOfDay } from "date-fns";
import { PRIORITIES, TAGS, type Priority, type Tag } from "@/types/tasks";

export interface TaskMatch {
  kind: "date" | "tag" | "priority";
  start: number;
  end: number;
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
) {
  // A symbol followed by one or more letters, digits, or underscores,
  // e.g. "#work" or "!high"; "g" finds every occurrence
  const pattern = new RegExp(`\\${symbol}(\\w+)`, "g");

  for (const match of text.matchAll(pattern)) {
    const value = options.find(
      (option) => option.toLowerCase() === match[1].toLowerCase(),
    );
    if (value) {
      return { value, start: match.index, end: match.index + match[0].length };
    }
  }
}

/**
 * Parses input like "Buy milk tomorrow 5pm #personal !high" into a title,
 * due date, tag, and priority. Unrecognized keywords stay in the title.
 * */
export function parseTaskInput(text: string): ParsedTask {
  const matches: TaskMatch[] = [];
  let dueDate: Date | undefined;

  // forwardDate makes "friday" mean the coming friday, not the last one
  const date = chrono.parse(text, new Date(), { forwardDate: true })[0];
  if (date) {
    // Date-only due dates are stored as the end of their day
    dueDate = date.start.isCertain("hour")
      ? date.start.date()
      : endOfDay(date.start.date());
    matches.push({
      kind: "date",
      start: date.index,
      end: date.index + date.text.length,
    });
  }

  const tag = findOption(text, "#", TAGS);
  if (tag) matches.push({ kind: "tag", start: tag.start, end: tag.end });

  const priority = findOption(text, "!", PRIORITIES);
  if (priority) {
    matches.push({
      kind: "priority",
      start: priority.start,
      end: priority.end,
    });
  }

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
