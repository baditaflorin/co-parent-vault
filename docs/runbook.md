# Runbook

Mode A has no server processes.

## Local Verification

```bash
npm install
make lint
make test
make build
make smoke
```

## Common Issues

If assets 404 locally, preview the app at:

http://127.0.0.1:4173/co-parent-vault/

If OCR is slow, use a smaller receipt image. OCR runs entirely in the browser and depends on the user's device.

If a passphrase is forgotten, the encrypted vault cannot be recovered. Restore from another encrypted export if available.
