# 0001 - Deployment Mode

## Status

Accepted

## Context

The product handles sensitive child, custody, receipt, document, and co-parent communication data. A hosted runtime backend would create a custody target for private family records and would contradict the privacy value proposition.

## Decision

Use Mode A: Pure GitHub Pages. The app is a static PWA served from `main` `/docs`. All data entry, encryption, OCR, CRDT packaging, ICS handling, reporting, and optional local LLM calls run in the browser.

## Consequences

User data stays local and encrypted at rest in IndexedDB. Sharing happens through encrypted files and cryptographic invite payloads. There is no server-side account system, runtime database, metrics endpoint, Docker image, or nginx deployment in v1.

## Alternatives Considered

Mode B was unnecessary because v1 has no shared public dataset. Mode C was rejected because runtime mutations and hosted auth are not required for v1.
