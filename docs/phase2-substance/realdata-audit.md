# Phase 2 Substance Real-Data Audit

Date: 2026-05-08

Mode remains Mode A: Pure GitHub Pages.

## Fixture Candidates

The product handles private family data, so this audit uses public/non-PII specimens from real-world formats and common co-parenting workflows rather than real custody records.

Sources consulted:

- https://icalendar.org/iCalendar-RFC-5545/3-6-1-event-component.html
- https://www.webdavsystem.com/server/creating_caldav_carddav/calendar_ics_file_structure/
- https://www.splitmyexpenses.com/articles/how-to-import-from-splitwise
- https://huggingface.co/datasets/docjay131/receipts-ocr-dataset
- https://www.ourfamilywizard.com/blog/co-parenting-shared-expenses
- https://theeasywisdom.com/co-parenting-playbook/

## Inputs

### 1. Clean single-event ICS

Input: RFC-style `VEVENT` with `UID`, `DTSTAMP`, `DTSTART`, `DTEND`, `SUMMARY`, `LOCATION`, and `DESCRIPTION`.

What v1 did: Imported the event with title, start, end, location, and notes.

What it should have done: Same, plus preserve `UID`, source file metadata, and import confidence.

Why it failed: The happy path works but throws away provenance and stable external IDs.

Failure style: Silent loss of metadata.

Manual work: User has to remember where the event came from and whether it was already imported.

### 2. Recurring parenting schedule ICS

Input: `VEVENT` with `RRULE:FREQ=WEEKLY;BYDAY=MO,WE;COUNT=12`, `TZID`, and one overridden instance.

What v1 did: Imported one base event only.

What it should have done: Expand occurrences in a bounded preview, preserve recurrence metadata, and flag overridden instances.

Why it failed: Import logic maps every `VEVENT` to one record and ignores recurrence rules.

Failure style: Wrong-but-confident; the calendar looks imported but is missing most exchange days.

Manual work: User must manually recreate every occurrence.

### 3. All-day no-DTEND ICS

Input: Standards-valid all-day event with `DTSTART;VALUE=DATE:20260508` and no `DTEND`.

What v1 did: Likely crashes or produces an invalid event because import assumes `event.endDate` exists.

What it should have done: Treat it as a one-day all-day event, as RFC 5545 specifies.

Why it failed: No domain fallback for omitted optional end dates.

Failure style: Recoverable parser issue becomes user-visible failure or invalid state.

Manual work: User has to edit or repair the ICS before import.

### 4. Timezone-heavy Outlook/Google ICS

Input: Events with `TZID=America/New_York`, `VTIMEZONE`, folded lines, alarms, attendees, organizer, and descriptions.

What v1 did: Imported visible event fields but discarded attendees, organizer, alarms, original timezone, and source UID.

What it should have done: Normalize time deterministically, preserve original timezone/source metadata, and show ignored fields as import notes.

Why it failed: The model only stores the simplified event shape.

Failure style: Mostly silent; user cannot tell what was lost.

Manual work: User must manually paste important attendee/organizer context into notes.

### 5. Splitwise-style group export CSV

Input: CSV with `Date`, `Description`, `Category`, `Cost`, `Currency`, and per-person balance columns.

What v1 did: No CSV import path; user must type each expense manually.

What it should have done: Sniff columns, infer amount/currency/category/paid-by/split-with, detect duplicates, and produce editable draft expenses.

Why it failed: Expense entry is form-only; no structure inference.

Failure style: Missing capability inside an existing workflow, not a crash.

Manual work: User re-enters rows, increasing error risk.

### 6. Bank/card statement CSV

Input: Statement export with CRLF, quoted descriptions containing commas, negative amounts, balance column, and dates like `05/08/2026`.

What v1 did: No import path.

What it should have done: Parse robust CSV, classify child-related candidate rows, normalize dates/amounts, and ask for confirmation only on ambiguous rows.

Why it failed: No delimiter/encoding/date/amount inference exists for expenses.

Failure style: User has to do all classification manually.

Manual work: User filters the bank file outside the app, then types selected expenses.

### 7. Receipt OCR text with subtotal, tax, tip, and total

Input: Restaurant-style OCR text with `Subtotal 20.00`, `Tax 1.80`, `Tip 4.00`, `Total 25.80`.

What v1 did: The parser can stop on the first `total`-like field or pick the wrong amount depending on wording.

What it should have done: Prefer final payable total, retain subtotal/tax/tip fields, and expose confidence.

Why it failed: The receipt parser uses shallow regexes, not receipt layout/domain ranking.

Failure style: Wrong-but-confident amount.

Manual work: User must notice and correct the amount.

### 8. Receipt/invoice OCR text with amount due and insurance adjustment

Input: Medical invoice text with charge, insurance adjustment, patient responsibility, previous payment, and `Amount Due`.

What v1 did: Likely chooses the largest amount, which may be the pre-insurance charge, not the reimbursable amount due.

What it should have done: Recognize medical-billing vocabulary and prefer patient responsibility or amount due.

Why it failed: No domain-aware expense vocabulary.

Failure style: Wrong-but-confident and legally/financially risky.

Manual work: User must interpret the invoice themselves.

### 9. Email/SMS thread pasted into communication archive

Input: Forwarded email thread with headers, quoted replies, signatures, mixed dates, and one reimbursement request.

What v1 did: Stores whatever the user pastes as one body.

What it should have done: Infer counterpart, occurred-at date, channel, subject, tags, action items, and split quoted history into draft records.

Why it failed: No communication parsing or first-guess classification.

Failure style: Not wrong, but feels passive and dumb.

Manual work: User labels everything manually.

### 10. Child document upload with meaningful filename

Input: Files like `Maya_2026-04-12_immunization_record.pdf`, `IEP-final-signed.pdf`, and `passport_exp_2028.jpg`.

What v1 did: Stores the file with user-entered or filename-derived name, selected kind, hash, and notes.

What it should have done: Infer child, document kind, key date, possible expiry, and suggested tags from filename/OCR text when available.

Why it failed: Document storage does no filename or content inference.

Failure style: User has to tell the app obvious metadata.

Manual work: User classifies every document from scratch.

## Top 5 Logic Gaps

1. ICS import ignores recurrence, overrides, missing `DTEND`, and provenance, so real parenting schedules can import as incomplete calendars.
2. Expense flow has no CSV import/inference, so Splitwise and bank exports cannot become draft expenses.
3. Receipt parsing is regex-only and can choose the wrong financial amount without warning.
4. Communication archive stores pasted threads as opaque blobs instead of extracting dates, counterpart, channel, subject, tags, and action items.
5. Documents store bytes and hashes but infer no child, kind, dates, expiry, or tags from filenames/content.

## Top 3 Intuition Failures

1. Importing a recurring calendar looks successful even when most occurrences are missing.
2. OCR gives editable fields but no confidence or reasoning, so a wrong amount looks authoritative.
3. The app asks for manual classification immediately even when the input already contains obvious hints.

## Top 3 Feels-Stupid Moments

1. User uploads a Splitwise/bank CSV and the app has no useful first guess.
2. User uploads `immunization_record.pdf` and still has to choose `medical`.
3. User pastes an email thread with visible headers and still has to type counterpart/date/channel/tags.

## What Smart Means For This Product

- Importing real calendar files should produce a faithful, bounded, editable schedule preview with recurrence, timezone, and missing-end handling.
- Uploading or pasting financial proof should produce draft expenses with inferred amount, currency, category, date, payer, split, and confidence.
- Pasting communication should become structured archive drafts, not one undifferentiated text blob.
- Uploading documents should infer document kind, child, dates, and reminders from filename/OCR text when confidence is high enough.
- Every inference should show confidence and provenance, and low-confidence fields should ask for correction without blocking the first useful preview.

## Phase 2 Substance Success Metrics

- At least 7 of 10 real-data fixtures complete the primary flow with no manual intervention beyond correction/confirmation.
- No fixture produces wrong-but-confident output; low-confidence inferred fields are visibly marked.
- ICS fixture determinism: same input produces byte-identical normalized event drafts in 10/10 runs.
- Expense/receipt fixture determinism: same input produces byte-identical draft expense JSON in 10/10 runs.
- Median time from input to useful draft preview is under 1 second for text/CSV/ICS fixtures and under 5 seconds for OCR fixtures.
- Inputs up to 5 MB do not freeze the UI; operations over 300 ms show progress and operations over 5 seconds can be cancelled.
- Every failure has a what/why/now-what message in co-parenting domain language.

## Out Of Scope

- No backend, accounts, hosted sync, or Mode C escalation.
- No new product surface beyond the existing calendar, expenses, archive, documents, privacy/export workflows.
- No visual polish, redesign, dark mode, command palette, marketing pages, or analytics.
- No payment integrations, bank API connections, court filing, legal advice, judge portal, or enforcement workflows.
- No live multi-user collaboration beyond existing encrypted export/import and invite concepts.
