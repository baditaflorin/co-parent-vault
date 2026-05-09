# 0049 - Inspectability and Debug Surface

## Status

Accepted

## Context

Users and maintainers need to see why inferences happened.

## Decision

Expose inference reasons, warnings, and confidence inline. Add `?debug=1` to show internal counts, schema version, app version, source commit, and recent activity.

## Consequences

Support and fixture debugging become easier without adding telemetry.

## Alternatives Considered

Hidden internal state was rejected because it makes wrong guesses harder to diagnose.
