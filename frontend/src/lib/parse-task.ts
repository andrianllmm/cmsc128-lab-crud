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

// Lowercased word or phrase -> value, e.g. "high" -> "High"
type Lookup<T> = Record<string, T>;

function toLookup<T extends string>(options: readonly T[]) {
  return Object.fromEntries(
    options.map((option) => [option.toLowerCase(), option]),
  ) as Lookup<T>;
}

// Written out after "!" or on their own, e.g. "urgent" or "high priority"
const PRIORITY_SYNONYMS: Lookup<Priority> = {
  urgent: "High",
  asap: "High",
  p1: "High",
  "high priority": "High",
  p2: "Medium",
  "medium priority": "Medium",
  p3: "Low",
  "low priority": "Low",
};

// Only after "#", since plain words like "office" are too common in titles
const TAG_SYNONYMS: Lookup<Tag> = {
  office: "Work",
  homework: "School",
  class: "School",
  errand: "Personal",
};

const PRIORITY_NAMES = { ...toLookup(PRIORITIES), ...PRIORITY_SYNONYMS };
const TAG_NAMES = { ...toLookup(TAGS), ...TAG_SYNONYMS };

// Whole synonyms anywhere in the text, longest first so "high priority"
// isn't cut short by a shorter synonym
const PLAIN_PRIORITY = `\\b(${Object.keys(PRIORITY_SYNONYMS)
  .sort((a, b) => b.length - a.length)
  .join("|")})\\b`;

/**
 * Finds the first match of `pattern` (whose first group is the keyword)
 * that `lookup` knows and the user hasn't dismissed.
 * */
function findKeyword<T>(
  text: string,
  pattern: string,
  lookup: Lookup<T>,
  dismissed: ReadonlySet<string>,
) {
  for (const match of text.matchAll(new RegExp(pattern, "gi"))) {
    const value = lookup[match[1].toLowerCase()];
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

  const tag = findKeyword(text, "#(\\w+)", TAG_NAMES, dismissed);
  if (tag) matches.push({ kind: "tag", ...range(text, tag) });

  // "!high" is checked first, then plain words like "urgent"
  const priority =
    findKeyword(text, "!(\\w+)", PRIORITY_NAMES, dismissed) ??
    findKeyword(text, PLAIN_PRIORITY, PRIORITY_SYNONYMS, dismissed);
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
