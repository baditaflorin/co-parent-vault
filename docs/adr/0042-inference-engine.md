# 0042 - Inference Engine

## Status

Accepted

## Context

Users expect the app to infer obvious fields from existing data rather than requiring blank forms.

## Decision

Use small deterministic rule-based inference modules per domain. They return draft records, confidence, reasons, warnings, anomalies, stable IDs, and provenance. Rules favor conservative low-confidence output over silent wrongness.

## Consequences

The app can produce useful first guesses without a backend or model dependency. Future local LLM use can explain or summarize, but deterministic rules own primary import behavior.

## Alternatives Considered

Local LLM-only inference was rejected because it is non-deterministic, slower, and optional in v1.
