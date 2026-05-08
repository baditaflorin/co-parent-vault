import { describe, expect, it } from "vitest";
import { exportEventsToIcs, importEventsFromIcs } from "./ics";
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
});
