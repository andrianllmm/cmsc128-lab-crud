import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ListUser } from "@/types/lists";
import { parseTaskInput } from "./parse-task";

const member = (_id: string, displayName: string): ListUser => ({
  _id,
  displayName,
  email: `${_id}@example.com`,
});

const members = [member("1", "Juan Dela Cruz"), member("2", "Maria Santos")];

beforeEach(() => {
  // Monday, Nov 23 2026, noon local time
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 10, 23, 12, 0, 0));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("parseTaskInput", () => {
  it("leaves plain text as the title", () => {
    const parsed = parseTaskInput("Buy milk");
    expect(parsed.title).toBe("Buy milk");
    expect(parsed.dueDate).toBeUndefined();
    expect(parsed.priority).toBeUndefined();
    expect(parsed.tag).toBeUndefined();
    expect(parsed.assignee).toBeUndefined();
    expect(parsed.matches).toEqual([]);
  });

  describe("dates", () => {
    it("parses a date-only keyword as the end of that day", () => {
      const parsed = parseTaskInput("Buy milk tomorrow");
      expect(parsed.title).toBe("Buy milk");
      expect(parsed.dueDate).toEqual(new Date(2026, 10, 24, 23, 59, 59, 999));
    });

    it("keeps the time when one is given", () => {
      const parsed = parseTaskInput("Call mom tomorrow 5pm");
      expect(parsed.title).toBe("Call mom");
      expect(parsed.dueDate).toEqual(new Date(2026, 10, 24, 17, 0, 0));
    });

    it("resolves weekdays to the coming one", () => {
      const parsed = parseTaskInput("Report friday");
      expect(parsed.dueDate).toEqual(new Date(2026, 10, 27, 23, 59, 59, 999));
    });

    it("uses only the first of multiple dates", () => {
      const parsed = parseTaskInput("Trip tomorrow or friday");
      expect(parsed.dueDate).toEqual(new Date(2026, 10, 24, 23, 59, 59, 999));
      expect(parsed.matches.filter((m) => m.kind === "date")).toHaveLength(1);
      expect(parsed.title).toContain("friday");
    });
  });

  describe("tags", () => {
    it("parses a tag case-insensitively", () => {
      const parsed = parseTaskInput("Study #SCHOOL");
      expect(parsed.tag).toBe("School");
      expect(parsed.title).toBe("Study");
    });

    it("parses tag synonyms after #", () => {
      expect(parseTaskInput("Essay #homework").tag).toBe("School");
      expect(parseTaskInput("Slides #office").tag).toBe("Work");
      expect(parseTaskInput("Groceries #errand").tag).toBe("Personal");
    });

    it("does not treat bare synonyms as tags", () => {
      const parsed = parseTaskInput("Clean the office");
      expect(parsed.tag).toBeUndefined();
      expect(parsed.title).toBe("Clean the office");
    });

    it("keeps unknown tags in the title", () => {
      const parsed = parseTaskInput("Plan #unknown");
      expect(parsed.tag).toBeUndefined();
      expect(parsed.title).toBe("Plan #unknown");
    });
  });

  describe("priorities", () => {
    it("parses !priority names", () => {
      expect(parseTaskInput("Fix bug !high").priority).toBe("High");
      expect(parseTaskInput("Fix bug !Medium").priority).toBe("Medium");
      expect(parseTaskInput("Fix bug !low").priority).toBe("Low");
      expect(parseTaskInput("Fix bug !none").priority).toBe("None");
    });

    it("parses synonyms after ! and on their own", () => {
      expect(parseTaskInput("Fix bug !urgent").priority).toBe("High");
      expect(parseTaskInput("Fix bug urgent").priority).toBe("High");
      expect(parseTaskInput("Fix bug asap").priority).toBe("High");
      expect(parseTaskInput("Fix bug p2").priority).toBe("Medium");
      expect(parseTaskInput("Fix bug low priority").priority).toBe("Low");
    });

    it("does not treat bare priority names as keywords", () => {
      const parsed = parseTaskInput("Reach a new high");
      expect(parsed.priority).toBeUndefined();
      expect(parsed.title).toBe("Reach a new high");
    });

    it("keeps unknown ! words in the title", () => {
      const parsed = parseTaskInput("Wow !great");
      expect(parsed.priority).toBeUndefined();
      expect(parsed.title).toBe("Wow !great");
    });

    it("matches whole synonyms only", () => {
      const parsed = parseTaskInput("Check p10 and urgently");
      expect(parsed.priority).toBeUndefined();
    });

    it("prefers the longest synonym", () => {
      const parsed = parseTaskInput("Fix bug high priority");
      expect(parsed.priority).toBe("High");
      expect(parsed.title).toBe("Fix bug");
    });
  });

  describe("assignees", () => {
    it("matches by first name or full name without spaces", () => {
      expect(parseTaskInput("Review @juan", new Set(), members).assignee).toBe(
        "1",
      );
      expect(
        parseTaskInput("Review @mariasantos", new Set(), members).assignee,
      ).toBe("2");
    });

    it("is case-insensitive", () => {
      expect(parseTaskInput("Review @MARIA", new Set(), members).assignee).toBe(
        "2",
      );
    });

    it("ignores @names when there are no members", () => {
      const parsed = parseTaskInput("Review @juan");
      expect(parsed.assignee).toBeUndefined();
      expect(parsed.title).toBe("Review @juan");
    });

    it("keeps unknown names in the title", () => {
      const parsed = parseTaskInput("Review @pedro", new Set(), members);
      expect(parsed.assignee).toBeUndefined();
      expect(parsed.title).toBe("Review @pedro");
    });

    it("ignores first names shared by several members", () => {
      const shared = [member("1", "Juan Cruz"), member("2", "Juan Reyes")];
      expect(
        parseTaskInput("Review @juan", new Set(), shared).assignee,
      ).toBeUndefined();
      expect(
        parseTaskInput("Review @juanreyes", new Set(), shared).assignee,
      ).toBe("2");
    });
  });

  describe("combinations", () => {
    it("parses every keyword at once", () => {
      const parsed = parseTaskInput(
        "Buy milk tomorrow 5pm #personal !high @juan",
        new Set(),
        members,
      );
      expect(parsed.title).toBe("Buy milk");
      expect(parsed.dueDate).toEqual(new Date(2026, 10, 24, 17, 0, 0));
      expect(parsed.tag).toBe("Personal");
      expect(parsed.priority).toBe("High");
      expect(parsed.assignee).toBe("1");
      expect(parsed.matches.map((m) => m.kind).sort()).toEqual([
        "assignee",
        "date",
        "priority",
        "tag",
      ]);
    });

    it("parses keywords in the middle of the title", () => {
      const parsed = parseTaskInput("Buy #personal milk !low today");
      expect(parsed.title).toBe("Buy milk");
      expect(parsed.tag).toBe("Personal");
      expect(parsed.priority).toBe("Low");
    });
  });

  describe("ambiguous text", () => {
    it("keeps May as a plain name when it isn't a date", () => {
      const parsed = parseTaskInput("Call May about lunch");
      expect(parsed.dueDate).toBeUndefined();
      expect(parsed.title).toBe("Call May about lunch");
    });

    it("parses May as a month when a day follows", () => {
      const parsed = parseTaskInput("Party May 5");
      expect(parsed.dueDate).toEqual(new Date(2027, 4, 5, 23, 59, 59, 999));
      expect(parsed.title).toBe("Party");
    });

    it("lets the user dismiss a name that looks like a date", () => {
      const parsed = parseTaskInput("Party May 5", new Set(["may 5"]));
      expect(parsed.dueDate).toBeUndefined();
      expect(parsed.title).toBe("Party May 5");
    });
  });

  describe("highlight matches", () => {
    it("reports positions in the original text, sorted left to right", () => {
      const text = "Buy milk !high #work";
      const { matches } = parseTaskInput(text);
      expect(matches).toEqual([
        { kind: "priority", start: 9, end: 14, text: "!high" },
        { kind: "tag", start: 15, end: 20, text: "#work" },
      ]);
      for (const m of matches) {
        expect(text.slice(m.start, m.end).toLowerCase()).toBe(m.text);
      }
    });

    it("lowercases the matched text", () => {
      const { matches } = parseTaskInput("Study #WORK");
      expect(matches[0].text).toBe("#work");
    });

    it("sorts matches when keywords appear in a different order", () => {
      const { matches } = parseTaskInput("#work !high");
      expect(matches.map((m) => m.kind)).toEqual(["tag", "priority"]);
    });
  });

  describe("whitespace", () => {
    it("collapses whitespace left by removed keywords", () => {
      expect(parseTaskInput("Buy   #work   milk").title).toBe("Buy milk");
    });

    it("trims the title", () => {
      expect(parseTaskInput("  #work Buy milk !high  ").title).toBe("Buy milk");
    });

    it("collapses whitespace even with no keywords", () => {
      expect(parseTaskInput("Buy \t  milk").title).toBe("Buy milk");
    });

    it("returns an empty title when only keywords are given", () => {
      expect(parseTaskInput("#work !high").title).toBe("");
    });
  });

  describe("dismissed keywords", () => {
    it("keeps a dismissed tag in the title", () => {
      const parsed = parseTaskInput("Study #work", new Set(["#work"]));
      expect(parsed.tag).toBeUndefined();
      expect(parsed.title).toBe("Study #work");
      expect(parsed.matches).toEqual([]);
    });

    it("keeps a dismissed priority in the title", () => {
      const parsed = parseTaskInput("Fix !high", new Set(["!high"]));
      expect(parsed.priority).toBeUndefined();
      expect(parsed.title).toBe("Fix !high");
    });

    it("keeps a dismissed plain synonym in the title", () => {
      const parsed = parseTaskInput("Fix urgent", new Set(["urgent"]));
      expect(parsed.priority).toBeUndefined();
      expect(parsed.title).toBe("Fix urgent");
    });

    it("keeps a dismissed date in the title", () => {
      const parsed = parseTaskInput("Buy milk tomorrow", new Set(["tomorrow"]));
      expect(parsed.dueDate).toBeUndefined();
      expect(parsed.title).toBe("Buy milk tomorrow");
    });

    it("keeps a dismissed assignee in the title", () => {
      const parsed = parseTaskInput(
        "Review @juan",
        new Set(["@juan"]),
        members,
      );
      expect(parsed.assignee).toBeUndefined();
      expect(parsed.title).toBe("Review @juan");
    });

    it("falls through to the next occurrence of a keyword", () => {
      const parsed = parseTaskInput("#work a #school", new Set(["#work"]));
      expect(parsed.tag).toBe("School");
      expect(parsed.title).toBe("#work a");
    });

    it("only dismisses the matching keyword", () => {
      const parsed = parseTaskInput("Fix !high #work", new Set(["!high"]));
      expect(parsed.priority).toBeUndefined();
      expect(parsed.tag).toBe("Work");
    });
  });
});
