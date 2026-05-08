# 0013 - Testing Strategy

## Status

Accepted

## Context

The highest risk areas are schema validation, export/import, ICS parsing, receipt parsing, and smoke behavior on Pages.

## Decision

Use Vitest for colocated unit tests and Playwright for one happy-path browser smoke test. `make test`, `make build`, and `make smoke` are the pre-push confidence path.

## Consequences

Tests stay fast enough for local hooks. Heavy OCR and DuckDB paths are verified through lazy-load smoke coverage where practical.

## Alternatives Considered

GitHub Actions were rejected by project constraint.
