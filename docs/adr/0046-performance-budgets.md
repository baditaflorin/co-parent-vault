# 0046 - Performance Budgets

## Status

Accepted

## Context

Substance work adds heavier parsing and inference to the existing static app.

## Decision

Text, CSV, and ICS inference should produce drafts in under 1 second for fixtures up to 5 MB. OCR may exceed 5 seconds, but must show progress and support cancellation. DuckDB and OCR stay lazy-loaded.

## Consequences

Fixture tests record elapsed time. The UI shows progress for slow OCR and avoids blocking previews for text-based imports.

## Alternatives Considered

Server-side parsing was rejected because it would require uploading private family data.
