# Contributing

Thanks for helping improve `co-parent-vault`.

## Local workflow

```bash
npm install
make install-hooks
make test
make build
make smoke
```

Use Conventional Commits for commit messages:

```text
feat: add receipt OCR
fix: preserve encrypted import metadata
docs: update privacy notes
```

Do not commit secrets, private keys, real `.env` files, or personal family data.
