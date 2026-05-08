# 0008 - Go Backend Layout

## Status

Accepted

## Context

The bootstrap requested Go layout only for Modes B and C.

## Decision

Skip Go backend scaffolding in Mode A.

## Consequences

There are no `cmd`, `internal`, `pkg`, `api`, runtime server, Docker image, or backend environment variables in v1.

## Alternatives Considered

A tiny Go helper was rejected because Node/Vite already covers the static build workflow.
