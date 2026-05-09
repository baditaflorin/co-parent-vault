# Phase 2 Substance Postmortem

## Real-Data Pass Rate

Before: 3/10 fixtures were useful without manual repair. Clean single-event ICS worked, simple receipt text partially worked, and plain document storage worked only as storage.

After: 10/10 fixtures produce deterministic useful drafts with confidence, warnings, or inferred metadata.

| Fixture                 |                     Before |                                                          After |
| ----------------------- | -------------------------: | -------------------------------------------------------------: |
| Clean single-event ICS  |    Pass with metadata loss |                                           Pass with provenance |
| Recurring parenting ICS |       Fail: one event only |                                            Pass: 6 occurrences |
| All-day no-DTEND ICS    |                 Fail/risky |                                     Pass with fallback warning |
| Timezone/attendees ICS  |        Partial silent loss |                                        Pass with metadata note |
| Splitwise CSV           |            Fail: no import |                                           Pass: draft expenses |
| Bank CSV                |            Fail: no import | Pass: child-related draft expenses and skipped payment warning |
| Restaurant receipt text |         Risky amount guess |                                              Pass: final total |
| Medical invoice text    | Risky largest-amount guess |                        Pass: amount due/patient responsibility |
| Email thread            |                Opaque blob |                                 Pass: structured archive draft |
| Document filenames      |      Manual classification |                                Pass: kind/date/child inference |

## Top 5 Logic Gaps Closed

1. ICS recurrence, missing `DTEND`, timezone, and provenance now produce bounded draft events with stable IDs and warnings.
2. Splitwise and bank CSVs now infer expense drafts through delimiter sniffing, quoted CSV parsing, column classification, signed amount handling, and child-domain category inference.
3. Receipt text parsing now ranks amount candidates by receipt and medical-billing vocabulary instead of picking the largest or first regex match.
4. Communication archive can infer counterpart, date, channel, subject, tags, and action items from pasted email/SMS threads.
5. Document uploads infer kind, child, document date, expiry year, tags, confidence, and reasons from filenames.

## Promised Smart Behaviors

- Calendar import gives useful editable drafts on recurring, all-day, and timezone fixtures.
- Financial import gives useful expense drafts on CSV, receipt, and invoice fixtures.
- Communication paste creates a structured archive draft on the email-thread fixture.
- Document upload inference works on medical, school, and identity filename fixtures.
- Every fixture output carries confidence and warnings where appropriate.

## Determinism

Pass: 10/10 fixtures produce byte-identical normalized draft JSON across repeated runs in `src/test/realdata-fixtures.test.ts`.

Stable IDs are derived from normalized source data instead of random UUIDs during inference.

## Performance

Fixture suite runtime observed under Vitest: 10 real-data fixture tests completed in roughly 50-130 ms per run on this machine. Text, CSV, and ICS fixture inference is comfortably below the 1 second budget. OCR remains device-dependent and user-triggered; v0.2.0 keeps Tesseract lazy-loaded and continues to show progress.

## What Surprised Me

The biggest surprise was how many failures were not crashes. They were quiet losses: recurring calendar events collapsing to one item, organizer/attendee metadata disappearing, and receipt totals looking plausible while being wrong. The app needed confidence and provenance as much as parsing.

## Still Open For Phase 3

1. True preview-and-accept queues instead of immediately adding imported drafts to the vault.
2. OPFS-backed encrypted document blobs for large document archives.
3. A cancellable OCR worker wrapper with explicit abort controls.
4. Duplicate detection across repeated calendar/CSV imports.
5. In-session correction memory for categories, payer/split choices, and document kinds.

## Honest Take

The app is no longer just a happy-path toy for the audited domains. It now makes useful first guesses from messy calendars, expenses, receipts, messages, and document names. It still feels early where imports are immediately applied instead of staged for review, and OCR cancellation is not yet strong enough for very large scans. The engine is materially smarter; the next toy-like edge is workflow reversibility, not basic understanding.
