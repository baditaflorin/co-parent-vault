# 0014 - Error Handling Conventions

## Status

Accepted

## Context

Errors in encryption, imports, OCR, and local LLM calls must be understandable without leaking private data.

## Decision

Return typed results or throw contextual errors without embedding record payloads. The UI shows concise error toasts and keeps the previous valid vault state.

## Consequences

Import failures do not corrupt the existing vault. Logs avoid sensitive record contents.

## Alternatives Considered

Silent failures were rejected because users need confidence for legal and reimbursement workflows.
