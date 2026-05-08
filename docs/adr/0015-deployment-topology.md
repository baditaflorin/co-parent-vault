# 0015 - Deployment Topology

## Status

Accepted

## Context

Mode A deploys only static files.

## Decision

GitHub Pages serves `https://baditaflorin.github.io/co-parent-vault/` from `main` `/docs`. There is no `deploy/` directory, Docker Compose stack, nginx proxy, or hosted database.

## Consequences

Rollback is a git revert of the publishing commit followed by push. Custom domains can be added later with a `CNAME` file.

## Alternatives Considered

Docker hosting was rejected because v1 does not need runtime APIs.
