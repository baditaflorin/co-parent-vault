# 0006 - WASM Modules

## Status

Accepted

## Context

OCR and analytical SQL are useful but too heavy for initial page load.

## Decision

Lazy-load Tesseract.js for receipt OCR and DuckDB-WASM for expense analytics. Use non-threaded DuckDB bundles so GitHub Pages can serve the app without custom COOP/COEP headers.

## Consequences

Initial load stays focused on the vault UI. OCR and reports download only after explicit user action.

## Alternatives Considered

Server-side OCR/reporting was rejected because it would require uploading sensitive receipts and expenses.
