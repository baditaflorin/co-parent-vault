# Phase 2 State Taxonomy

- `loading-local-state`: IndexedDB lookup in progress. Exit: loaded or recoverable error.
- `setup-empty`: no local encrypted vault. Exit: create vault or import encrypted export.
- `locked`: encrypted vault exists, passphrase not held in memory. Exit: unlock, import, reset browser vault.
- `unlocked-empty`: vault open with no child records. Exit: add child, import data, lock, export.
- `unlocked-some`: vault open with records. Exit: add/edit/import/export/lock.
- `importing-text`: CSV/ICS/thread inference running. Exit: accept drafts, cancel before apply, or recoverable error.
- `ocr-running`: Tesseract worker running. Exit: parsed draft, cancel, or recoverable error.
- `saving`: encrypted vault write pending. Exit: saved or recoverable save error.
- `recoverable-error`: prior vault state preserved. Exit: retry, correct input, dismiss, export.
- `fatal-error`: app shell failed. Exit: reload or export local encrypted backup if available.
- `debug`: `?debug=1` exposes counts, version, commit, and recent activity without telemetry.
