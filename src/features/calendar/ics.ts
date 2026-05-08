import ICAL from "ical.js";
import type { CalendarEvent, Child } from "../../lib/schemas";

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function toIcsDate(value: string): string {
  return new Date(value)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

function fromIcalTime(value: ICAL.Time): string {
  return value.toJSDate().toISOString();
}

export function exportEventsToIcs(events: CalendarEvent[], children: Child[]): string {
  const childById = new Map(children.map((child) => [child.id, child.name]));
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//co-parent-vault//local-first//EN",
    "CALSCALE:GREGORIAN"
  ];

  for (const event of events) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${event.id}@co-parent-vault`,
      `DTSTAMP:${toIcsDate(event.updatedAt)}`,
      `DTSTART:${toIcsDate(event.start)}`,
      `DTEND:${toIcsDate(event.end)}`,
      `SUMMARY:${escapeIcsText(event.title)}`,
      `CATEGORIES:${escapeIcsText(childById.get(event.childId) ?? "Child")}`
    );

    if (event.location) {
      lines.push(`LOCATION:${escapeIcsText(event.location)}`);
    }
    if (event.notes) {
      lines.push(`DESCRIPTION:${escapeIcsText(event.notes)}`);
    }
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return `${lines.join("\r\n")}\r\n`;
}

export function importEventsFromIcs(text: string, fallbackChildId: string): CalendarEvent[] {
  const component = new ICAL.Component(ICAL.parse(text));
  const events = component.getAllSubcomponents("vevent");
  const now = new Date().toISOString();

  return events.map((componentEvent) => {
    const event = new ICAL.Event(componentEvent);
    return {
      id: crypto.randomUUID(),
      childId: fallbackChildId,
      title: event.summary || "Imported event",
      start: fromIcalTime(event.startDate),
      end: fromIcalTime(event.endDate),
      location: event.location || "",
      notes: event.description || "",
      createdAt: now,
      updatedAt: now
    };
  });
}
