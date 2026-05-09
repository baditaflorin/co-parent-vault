# 0047 - Error Taxonomy and Messaging Guidelines

## Status

Accepted

## Context

Errors must help users recover without losing sensitive work.

## Decision

Use actionable errors with `what`, `why`, `nowWhat`, severity, and recoverability. Recoverable errors keep current vault state intact. Fatal errors must offer export/recovery guidance where possible.

## Consequences

Import code returns structured issues instead of raw thrown strings when the problem is domain-related.

## Alternatives Considered

Throwing raw exceptions was rejected because it produces technical and often unactionable messages.
