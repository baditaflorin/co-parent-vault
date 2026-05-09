# 0043 - Domain Vocabulary and UI Language

## Status

Accepted

## Context

Raw parser language makes failures feel technical and unhelpful.

## Decision

Errors and warnings use co-parenting domain terms: exchange schedule, reimbursement, receipt total, amount due, archive record, child document, event invite, and imported draft. Developer terms such as selector, AST, or parse node do not appear in user-facing text.

## Consequences

Users can understand what failed and what to do next without reading implementation details.

## Alternatives Considered

Generic exception messages were rejected because they create stuck states.
