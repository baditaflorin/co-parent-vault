# 0009 - Configuration and Secrets Management

## Status

Accepted

## Context

No secrets may be committed or embedded in the frontend.

## Decision

The app has no build-time secrets. Public links, repo URL, PayPal URL, version, and commit are compile-time public metadata. Optional local LLM endpoints are user-entered browser settings and should point to localhost or a user-controlled service.

## Consequences

`.env.example` contains placeholders only. Gitleaks is wired into local hooks.

## Alternatives Considered

Hosted identity and API tokens were rejected for v1.
