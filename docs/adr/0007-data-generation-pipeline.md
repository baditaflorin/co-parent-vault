# 0007 - Data Generation Pipeline

## Status

Accepted

## Context

Mode B is not used.

## Decision

No static data generation pipeline exists in v1.

## Consequences

`make data` is intentionally absent. User-created data never enters the repository.

## Alternatives Considered

A scheduled artifact pipeline was rejected because the app has no public source dataset.
