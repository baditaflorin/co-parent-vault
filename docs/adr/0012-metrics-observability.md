# 0012 - Metrics and Observability

## Status

Accepted

## Context

Analytics could create privacy risk and is not required to validate v1.

## Decision

Do not add client analytics in v1. Use local tests, smoke tests, and manual verification instead.

## Consequences

There is no usage tracking, no beacon, no third-party analytics script, and no server-side metrics.

## Alternatives Considered

Plausible was considered but rejected because the product category is sensitive and early validation can happen without telemetry.
