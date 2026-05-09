# 0050 - Interaction Learning Policy

## Status

Accepted

## Context

Remembering user corrections can make the app feel smarter, but hidden personalization can feel surprising in a sensitive family tool.

## Decision

Phase 2 remembers only transparent in-session defaults where they directly reduce re-entry, such as the last selected child, payer, split counterpart, and document kind. It does not train persistent models or infer sensitive preferences across vault exports.

## Consequences

The app becomes less repetitive without opaque behavior or privacy risk.

## Alternatives Considered

Persistent learned profiles were rejected for Phase 2 because they need clearer privacy controls.
