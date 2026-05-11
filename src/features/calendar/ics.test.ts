import { describe, expect, it } from "vitest";
import { exportEventsToIcs, importEventDraftsFromIcs, importEventsFromIcs } from "./ics";
import type { CalendarEvent, Child } from "../../lib/schemas";

describe("ICS helpers", () => {
  it("exports and imports events", () => {
    const child: Child = { id: "child-1", name: "Sam", color: "#0f766e" };
    const event: CalendarEvent = {
      id: "event-1",
      childId: child.id,
      title: "School conference",
      start: "2026-05-08T10:00:00.000Z",
      end: "2026-05-08T11:00:00.000Z",
      location: "School",
      notes: "Bring records",
      createdAt: "2026-05-01T00:00:00.000Z",
      updatedAt: "2026-05-01T00:00:00.000Z"
    };

    const ics = exportEventsToIcs([event], [child]);
    const imported = importEventsFromIcs(ics, child.id);

    expect(ics).toContain("BEGIN:VEVENT");
    expect(imported[0].title).toBe("School conference");
    expect(imported[0].childId).toBe(child.id);
  });

  it("folds long lines to 75 octets per RFC 5545", () => {
    const child: Child = { id: "child-1", name: "Sam", color: "#0f766e" };
    const longNote =
      "This is a very long note that intentionally exceeds the seventy-five " +
      "octet limit imposed by RFC 5545 so that we can verify line folding " +
      "actually kicks in and produces a continuation line beginning with a single space.";
    const event: CalendarEvent = {
      id: "event-long",
      childId: child.id,
      title: "Long note",
      start: "2026-05-08T10:00:00.000Z",
      end: "2026-05-08T11:00:00.000Z",
      location: "",
      notes: longNote,
      createdAt: "2026-05-01T00:00:00.000Z",
      updatedAt: "2026-05-01T00:00:00.000Z"
    };

    const ics = exportEventsToIcs([event], [child]);
    const physicalLines = ics.split("\r\n");
    for (const physical of physicalLines) {
      const octets = new TextEncoder().encode(physical).length;
      expect(octets).toBeLessThanOrEqual(75);
    }

    const drafts = importEventDraftsFromIcs(ics, child.id);
    expect(drafts[0].event.notes).toContain("seventy-five");
  });

  it("folds multi-byte UTF-8 lines without splitting a codepoint", () => {
    const child: Child = { id: "child-1", name: "Sam", color: "#0f766e" };
    // Each character is 3 bytes in UTF-8, so 40 of them = 120 octets > 75.
    const accented = "Café conférence éducation séjour ".repeat(4);
    const event: CalendarEvent = {
      id: "event-utf",
      childId: child.id,
      title: accented,
      start: "2026-05-08T10:00:00.000Z",
      end: "2026-05-08T11:00:00.000Z",
      location: "",
      notes: "",
      createdAt: "2026-05-01T00:00:00.000Z",
      updatedAt: "2026-05-01T00:00:00.000Z"
    };

    const ics = exportEventsToIcs([event], [child]);
    // After folding, the round-tripped SUMMARY must still be the original
    // string: a split inside a UTF-8 codepoint would corrupt the text.
    const drafts = importEventDraftsFromIcs(ics, child.id);
    expect(drafts[0].event.title).toBe(accented);
  });
});
