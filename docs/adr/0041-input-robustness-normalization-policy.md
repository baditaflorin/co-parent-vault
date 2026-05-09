# 0041 - Input Robustness and Normalization Policy

## Status

Accepted

## Context

Real user data includes BOMs, CRLF, NBSP, smart quotes, folded ICS lines, quoted CSV cells, partial input, and mixed date formats.

## Decision

Normalize text at boundaries: strip UTF-8 BOM, normalize Unicode to NFC, convert CRLF/CR to LF, replace NBSP with regular spaces, normalize common smart punctuation, and collapse repeated horizontal whitespace only where the domain permits it. CSV and ICS keep structural newlines.

## Consequences

Parsers receive predictable text while preserving meaningful domain structure. Errors point to input rows or records when possible.

## Alternatives Considered

Ad hoc normalization inside each parser was rejected because behavior would drift between calendar, expense, receipt, and archive workflows.
