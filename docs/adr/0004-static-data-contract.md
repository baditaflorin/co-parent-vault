# 0004 - Static Data Contract

## Status

Accepted

## Context

Mode A has no public data pipeline or runtime API. The only durable data is user-owned browser state.

## Decision

The static app contract is:

- App shell: `docs/index.html`
- Hashed assets: `docs/assets/*`
- SPA fallback: `docs/404.html`
- Manifest and service worker: `docs/manifest.webmanifest`, `docs/sw.js`

User vaults use an encrypted JSON container with schema version `1`, format `co-parent-vault.yjs.secretbox.v1`, and a Yjs update payload.

## Consequences

The Pages artifact is self-contained. Breaking changes to vault schema require explicit migration logic before release.

## Alternatives Considered

REST JSON and static Parquet were rejected because v1 has no shared public data.
