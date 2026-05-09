# Phase 2 Substance Plan

Goal: make the existing Mode A app feel useful on messy family data before adding any new surface area.

## Ranked Substance Items

1. Robust ICS import for recurrence, all-day events, missing `DTEND`, timezone metadata, stable IDs, and warnings. Covers §2 items 1, 4, 5, 6, 9, 13, 16, 18, 22, 32, 35, 38.
2. Expense CSV inference for Splitwise and bank/card exports with delimiter sniffing, quoted field parsing, column classification, date/amount normalization, confidence, anomalies, and deterministic draft IDs. Covers 1, 2, 5, 6, 7, 8, 9, 13, 15, 16, 18, 22, 32, 35, 38.
3. Receipt intelligence for OCR text: amount ranking, amount-due vocabulary, date variants, currency detection, warning on ambiguity, and confidence. Covers 1, 2, 5, 7, 9, 12, 13, 15, 16, 18, 19, 32, 35.
4. Communication thread inference for pasted email/SMS: headers, counterpart, channel, date, subject, tags, action items, confidence, and low-confidence warnings. Covers 6, 7, 8, 9, 11, 12, 16, 18, 19, 32, 35.
5. Document filename inference: child, kind, date, expiry hints, tags, confidence, and provenance. Covers 6, 7, 8, 9, 11, 12, 16, 18, 19, 32, 35.
6. Shared normalization policy: BOM, CRLF/LF, NBSP, smart quotes, whitespace, Unicode normalization, partial input handling. Covers 2, 4, 5, 15, 33.
7. Boundary validation and actionable domain errors for imports. Covers 24, 25, 32, 33, 34.
8. Confidence model and visible confidence on inferred records. Covers 16, 19, 38.
9. Deterministic stable IDs and reproducible fixture outputs. Covers 22, 35, 38.
10. Cancellable OCR state with progress-safe recovery. Covers 25, 26, 27, 32.
11. Debug surface through `?debug=1` with inferred metadata and state counts. Covers 37.
12. Activity log for meaningful import/OCR/document/archive operations. Covers 36, 38.
13. State taxonomy documentation and no-stuck-state exits. Covers 24, 25, 27.
14. Performance budgets and measurement docs for text/CSV/ICS/OCR. Covers 28, 29, 31.
15. Fixture suite for 10 real-data cases plus synthetic edge cases. Covers 1, 3, 4, 5, 35.

The effective pick count is 27 distinct catalog items: 1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 15, 16, 18, 19, 22, 24, 25, 26, 27, 28, 29, 31, 32, 33, 34, 35, 36, 37, 38.

## Implementation Order

1. Fixtures and expected contracts.
2. Shared inference primitives, normalization, confidence, stable IDs, errors.
3. Calendar import intelligence.
4. Expense CSV and receipt intelligence.
5. Communication and document inference.
6. UI wiring inside existing screens.
7. Determinism, fixture, smoke, performance, and postmortem updates.
