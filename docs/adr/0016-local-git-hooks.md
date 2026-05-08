# 0016 - Local Git Hooks

## Status

Accepted

## Context

The project does not use GitHub Actions, so local hooks carry quality checks.

## Decision

Use a plain `.githooks/` directory wired by `make install-hooks`.

## Consequences

Pre-commit runs formatting, lint, TypeScript, and gitleaks when installed. Commit messages are validated as Conventional Commits. Pre-push runs tests, build, and smoke.

## Alternatives Considered

Lefthook was considered but plain hooks are sufficient for v1 and avoid another tool dependency.
