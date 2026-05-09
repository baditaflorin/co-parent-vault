# Phase 2 Performance Budgets

Budgets are local-browser budgets for the committed fixture set.

| Operation            | Fixture size target |                                     Budget | Behavior above budget                        |
| -------------------- | ------------------: | -----------------------------------------: | -------------------------------------------- |
| ICS inference        |          up to 5 MB |                                   p95 < 1s | Show import warning and keep prior vault     |
| CSV inference        |          up to 5 MB |                                   p95 < 1s | Show import warning and keep prior vault     |
| Receipt text parsing |          up to 1 MB |                                p95 < 300ms | Show progress if wrapped in OCR              |
| OCR image/PDF        |       user supplied | progress after 300ms; cancellable after 5s | User can cancel and prior form values remain |
| Thread parsing       |          up to 1 MB |                                   p95 < 1s | Low-confidence single draft with warnings    |

WASM modules remain lazy-loaded. The 38 MB DuckDB-WASM asset is accepted for v0.2.0 because reports are user-triggered and local.
