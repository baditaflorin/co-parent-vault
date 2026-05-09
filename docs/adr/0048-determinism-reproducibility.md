# 0048 - Determinism and Reproducibility

## Status

Accepted

## Context

Fixture outputs must be stable and users need to understand where imports came from.

## Decision

Use stable IDs derived from normalized source identifiers and content. Fixture outputs exclude volatile timestamps. Export/import payloads include schema version, app version, source commit, and provenance where practical.

## Consequences

Same input produces byte-identical draft JSON. User-facing records can still carry creation timestamps after acceptance into the vault.

## Alternatives Considered

Random IDs during inference were rejected because they break deterministic tests and duplicate detection.
