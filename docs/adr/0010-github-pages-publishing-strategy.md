# 0010 - GitHub Pages Publishing Strategy

## Status

Accepted

## Context

The live GitHub Pages URL must work from the first commit while project documentation remains in `docs/`.

## Decision

Publish GitHub Pages from `main` branch `/docs`. Vite builds into `docs/` with `emptyOutDir: false` so ADRs and documentation remain alongside the static app. The base path is `/co-parent-vault/`.

## Consequences

The built app, documentation, and fallback file are committed. `.gitignore` excludes `dist/` but not `docs/`. Asset filenames are hashed by Vite; `404.html` is copied from `index.html` after each build.

## Alternatives Considered

A `gh-pages` branch was considered but rejected to keep the first-day Pages setup simpler and visible on `main`.
