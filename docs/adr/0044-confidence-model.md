# 0044 - Confidence Model

## Status

Accepted

## Context

Wrong-but-confident output is the riskiest Phase 2 failure mode.

## Decision

Represent confidence as `high`, `medium`, or `low` plus numeric score `0..1`, reasons, and warnings. High means the app can apply the draft directly. Medium means apply but mark for review. Low means keep the draft editable and visibly ask the user to verify.

## Consequences

Confidence flows into imported records and fixture expected outputs. UI exposes confidence without blocking useful first guesses.

## Alternatives Considered

Hidden confidence was rejected because users need to know when the app is unsure.
