# 0002 - Architecture Overview and Module Boundaries

## Status

Accepted

## Context

The app needs multiple workflows without centralizing sensitive data in a service.

## Decision

Use a feature-oriented frontend:

- `features/calendar` handles events, ICS, and sealed invites.
- `features/expenses` handles reimbursements, receipt OCR, and reports.
- `features/messages` stores communication archives.
- `features/documents` stores local encrypted document records.
- `features/privacy` handles vault export/import, keys, and local LLM configuration.
- `lib` owns storage, crypto, schemas, Yjs snapshots, and shared utilities.

## Consequences

Feature code can evolve independently while shared cryptographic and persistence behavior stays centralized.

## Alternatives Considered

A page-only structure was rejected because workflow logic would become harder to test.
