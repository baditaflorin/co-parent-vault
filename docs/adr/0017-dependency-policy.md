# 0017 - Dependency Policy

## Status

Accepted

## Context

The app uses cryptography, OCR, CRDTs, SQL analytics, and ICS parsing.

## Decision

Use production-ready libraries rather than bespoke implementations: libsodium-wrappers, Yjs, Tesseract.js, DuckDB-WASM, ical.js, Zod, TanStack Query, React, and Vite.

## Consequences

Critical behavior sits on maintained packages. Heavy libraries are lazy-loaded to protect first load size.

## Alternatives Considered

Custom crypto, OCR, SQL, and ICS parsers were rejected.
