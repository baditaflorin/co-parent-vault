# 0045 - State Taxonomy and State Machine

## Status

Accepted

## Context

Long OCR/import operations can leave users uncertain whether work saved, failed, or is still running.

## Decision

Document and handle loading, locked, unlocked-empty, unlocked-some, importing, cancellable-running, recoverable-error, fatal-error, and debug states. Every state has an exit: retry, cancel, lock, import, export, or reset.

## Consequences

No import action may leave the UI half-mutated. Failed imports preserve the prior vault.

## Alternatives Considered

Implicit React state combinations were rejected because they make concurrency behavior accidental.
