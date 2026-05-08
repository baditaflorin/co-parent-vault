# 0011 - Logging Strategy

## Status

Accepted

## Context

Mode A has no server logs.

## Decision

Production browser logging is limited to unexpected errors surfaced through the global error boundary. Routine user records are never logged.

## Consequences

Debugging relies on local reproduction and explicit user-provided details, not telemetry.

## Alternatives Considered

Verbose console logging was rejected because it risks exposing sensitive data on shared devices.
