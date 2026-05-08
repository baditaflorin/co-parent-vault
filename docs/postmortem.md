# Postmortem

## What Was Built

`co-parent-vault` v0.1.0 is a Mode A GitHub Pages PWA for private co-parenting workflows. It includes encrypted local vault creation/unlock, IndexedDB persistence, Yjs vault snapshots, libsodium passphrase encryption and sealed event invites, shared calendar records, ICS import/export, expense tracking, receipt OCR through Tesseract.js, DuckDB-WASM expense reports, communication archives, child document storage, optional local LLM summaries, PWA assets, local hooks, tests, smoke checks, and committed Pages output.

## Was Mode A Correct?

Yes. The v1 workflows do not need hosted auth, a runtime API, or server-side storage. Keeping the app static avoids creating a custody target for sensitive family data and directly matches the privacy promise. Mode B is unnecessary because there is no shared public dataset. Mode C would add operational and legal risk without enabling a required v1 capability.

## What Worked

The GitHub Pages `/docs` strategy worked well once Vite was configured with `emptyOutDir: false` and a cleanup script that preserves ADRs. Browser-native IndexedDB plus encrypted Yjs snapshots gave the app a simple local-first persistence model. Playwright caught a real smoke-test isolation issue before publish.

## What Did Not Work

`libsodium-wrappers` needed a Vite alias for its ESM dependency layout and runtime handling for its default export shape. The first smoke setup reused an unrelated local server because Playwright allowed existing servers on a common port. Build metadata based directly on `HEAD` caused Pages assets to churn after every commit, so v1 uses `.build-commit` to record the source commit displayed by the app.

## Surprises

DuckDB-WASM adds a large static WASM asset, roughly 38 MB, even though it is lazy-loaded. That is acceptable for Mode A v1 because reports are local and user-triggered, but future releases should evaluate a smaller report engine or a release-hosted artifact strategy.

## Accepted Tech Debt

- Vault exports are encrypted snapshots, not multi-device live sync.
- Sealed invites use libsodium age-style X25519 sealed boxes, not age CLI interoperability.
- Document files are stored inside the encrypted IndexedDB vault; large long-term archives may need OPFS chunking.
- Local LLM calls depend on user-controlled endpoints and browser CORS behavior.
- The security disclosure channel uses GitHub private advisories until a project email is configured.

## Next 3 Improvements

1. Add OPFS-backed document blobs with encrypted metadata in IndexedDB.
2. Add deterministic vault migrations and a schema migration test harness.
3. Add optional encrypted peer sync through a user-supplied relay or file-based Yjs update exchange.

## Time Spent vs Estimate

Estimated: 5-7 hours for a working Mode A v1 scaffold and publish.

Actual: about 4 hours in one implementation pass, including GitHub Pages setup, app implementation, tests, smoke debugging, and publishing.
