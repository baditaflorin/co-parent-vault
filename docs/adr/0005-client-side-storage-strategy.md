# 0005 - Client-Side Storage Strategy

## Status

Accepted

## Context

The app needs offline persistence without a server.

## Decision

Store one encrypted vault container in IndexedDB. Keep decrypted records in memory only after the user unlocks with a passphrase. Store small UI preferences in memory for v1.

## Consequences

The browser can work offline. A forgotten passphrase cannot be recovered by the project. Cross-device movement happens through encrypted export/import.

## Alternatives Considered

Plain IndexedDB was rejected because local device compromise should not trivially expose records. OPFS remains an option for large future document storage.
