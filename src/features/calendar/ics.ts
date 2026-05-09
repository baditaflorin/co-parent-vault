import ICAL from "ical.js";
import type { CalendarEvent, Child } from "../../lib/schemas";
import { makeInference, reasonsToNotes, stableId } from "../../lib/inference";
import { unfoldIcsLines } from "../../lib/normalize";

export type CalendarImportDraft = {
  event: CalendarEvent;
  sourceUid?: string;
  confidence: "high" | "medium" | "low";
  warnings: string[];
  reasons: string[];
};

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

function plusDays(value: ICAL.Time, days: number): string {
  const date = value.toJSDate();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
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
  return importEventDraftsFromIcs(text, fallbackChildId).map((draft) => draft.event);
}

export function importEventDraftsFromIcs(
  text: string,
  fallbackChildId: string
): CalendarImportDraft[] {
  const component = new ICAL.Component(ICAL.parse(unfoldIcsLines(text)));
  const events = component.getAllSubcomponents("vevent");
  const now = "2026-01-01T00:00:00.000Z";
  const drafts: CalendarImportDraft[] = [];

  for (const componentEvent of events) {
    const event = new ICAL.Event(componentEvent);
    drafts.push(...expandEvent(event, fallbackChildId, now));
  }

  return drafts;
}

function expandEvent(event: ICAL.Event, childId: string, now: string): CalendarImportDraft[] {
  const uid =
    event.uid || event.component.getFirstPropertyValue("uid")?.toString() || "missing-uid";
  const hasDtend = Boolean(event.component.getFirstProperty("dtend"));
  const title = event.summary || "Imported event";
  const timezone =
    event.startDate?.zone?.tzid === "floating" ? undefined : event.startDate?.zone?.tzid;
  const warnings: string[] = [];
  const reasons = ["recognized iCalendar VEVENT"];
  const allDay = Boolean(event.startDate?.isDate);
  const organizer =
    event.organizer || event.component.getFirstPropertyValue("organizer")?.toString();
  const attendees = event.component
    .getAllProperties("attendee")
    .map((property) => property.getFirstValue()?.toString());
  const metadataNotes = [
    event.description || "",
    organizer ? `Organizer: ${organizer}` : "",
    attendees.length > 0 ? `Attendees: ${attendees.filter(Boolean).join(", ")}` : ""
  ].filter(Boolean);

  if (organizer || attendees.length > 0) {
    warnings.push("Organizer or attendee metadata preserved as notes.");
  }

  if (timezone) {
    reasons.push(`timezone ${timezone} preserved`);
  }

  const occurrences: Array<{ start: ICAL.Time; end: ICAL.Time; recurrence: boolean }> = [];
  if (event.isRecurring()) {
    warnings.push("Recurring event expanded into draft occurrences.");
    const iterator = event.iterator();
    for (let index = 0; index < 64; index += 1) {
      const next = iterator.next();
      if (!next) {
        break;
      }
      const details = event.getOccurrenceDetails(next);
      occurrences.push({ start: details.startDate, end: details.endDate, recurrence: true });
    }
  } else {
    const endDate = event.endDate ?? event.startDate;
    occurrences.push({ start: event.startDate, end: endDate, recurrence: false });
  }

  return occurrences.map((occurrence, index) => {
    const occurrenceWarnings = [...warnings];
    let end = fromIcalTime(occurrence.end);
    if (!hasDtend && allDay) {
      occurrenceWarnings.push("No end time found; treated as one-day all-day event.");
      end = plusDays(occurrence.start, 1);
    } else if (!hasDtend) {
      occurrenceWarnings.push("No end time found; treated as one-hour event.");
      const endDate = occurrence.start.toJSDate();
      endDate.setUTCHours(endDate.getUTCHours() + 1);
      end = endDate.toISOString();
    }

    const onlyHandledWarnings = occurrenceWarnings.every((warning) =>
      /Recurring event expanded|Organizer or attendee metadata/.test(warning)
    );
    const score =
      occurrenceWarnings.length === 0
        ? 0.92
        : onlyHandledWarnings
          ? 0.84
          : occurrenceWarnings.length === 1
            ? 0.74
            : 0.62;
    const inference = makeInference({
      score,
      reasons,
      warnings: occurrenceWarnings,
      sourceId: uid
    });

    const notes = [metadataNotes.join("\n"), reasonsToNotes(reasons, occurrenceWarnings)]
      .filter(Boolean)
      .join("\n\n");

    const draftEvent: CalendarEvent = {
      id: stableId("evt", [uid, fromIcalTime(occurrence.start), index]),
      childId,
      title,
      start: fromIcalTime(occurrence.start),
      end,
      location: event.location || "",
      notes,
      allDay,
      timezone,
      sourceUid: uid,
      inference,
      createdAt: now,
      updatedAt: now
    };

    return {
      event: draftEvent,
      sourceUid: uid,
      confidence: inference.level,
      warnings: occurrenceWarnings,
      reasons
    };
  });
}
