# 0003 - Frontend Framework and Build Tooling

## Status

Accepted

## Context

The UI is form-heavy, stateful, and needs client-side tests plus Pages-ready builds.

## Decision

Use React, TypeScript strict mode, Vite, Tailwind CSS, TanStack Query, Zod, Vitest, and Playwright.

## Consequences

Vite provides fast local development and static output to `/docs`. React keeps the workflow UI predictable. Zod validates stored records before encryption/import.

## Alternatives Considered

Vanilla TypeScript was considered but rejected because the app has enough stateful workflows to benefit from React.
