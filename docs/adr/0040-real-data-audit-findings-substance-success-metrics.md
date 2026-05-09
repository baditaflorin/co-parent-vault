# 0040 - Real-Data Audit Findings and Substance Success Metrics

## Status

Accepted

## Context

The v1 app works on curated happy paths but fails or becomes passive when users bring real calendar files, CSV exports, OCR text, email threads, and document filenames.

## Decision

Use the 10 fixtures documented in `docs/phase2-substance/realdata-audit.md` as the Phase 2 grading rubric. Substance work must improve pass rate, determinism, confidence surfacing, and failure language without adding a backend or new product areas.

## Consequences

Every inference change is tested against real-data fixtures. A fixture regression blocks shipping unless an ADR explicitly documents the tradeoff.

## Alternatives Considered

Polishing UI first was rejected because it would not address wrong imports, missing recurrence, weak OCR interpretation, or manual re-entry.
