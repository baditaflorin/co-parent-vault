# co-parent-vault

![Live](https://img.shields.io/badge/live-GitHub%20Pages-0f766e)
![Mode](https://img.shields.io/badge/deployment-Mode%20A%20static-blue)
![License](https://img.shields.io/badge/license-MIT-black)

Private local-first co-parenting tools for calendars, expenses, documents, and communication archives.

Live app:

https://baditaflorin.github.io/co-parent-vault/

Repository:

https://github.com/baditaflorin/co-parent-vault

Support:

https://www.paypal.com/paypalme/florinbadita

![co-parent-vault screenshot](docs/screenshot.png)

## Quickstart

```bash
npm install
make dev
make test
make build
make pages-preview
```

## What It Does

`co-parent-vault` replaces the sensitive parts of court-recommended co-parenting SaaS with a static local-first PWA: encrypted household vaults, shared calendar events, ICS import/export, sealed event invites, expense tracking, receipt OCR, communication archives, child document storage, DuckDB-WASM reports, and optional localhost LLM summaries.

## Architecture

```mermaid
flowchart LR
  Pages["GitHub Pages static app"] --> Browser["Browser PWA"]
  Browser --> IndexedDB["Encrypted IndexedDB vault"]
  Browser --> Crypto["libsodium + Web Crypto"]
  Browser --> Calendar["ICS + sealed event invites"]
  Browser --> OCR["Tesseract.js OCR"]
  Browser --> Reports["DuckDB-WASM reports"]
  Browser --> LLM["Optional local LLM endpoint"]
```

## Docs

docs/architecture.md

docs/adr/

docs/deploy.md

docs/privacy.md
