# Deploy

Live URL:

https://baditaflorin.github.io/co-parent-vault/

Repository:

https://github.com/baditaflorin/co-parent-vault

## Publish

GitHub Pages is configured from `main` branch `/docs`.

```bash
make build
git add docs package.json package-lock.json
git commit -m "chore: publish pages build"
git push
```

## Rollback

Revert the publishing commit and push:

```bash
git revert <commit_sha>
git push
```

## Custom Domain

Add `docs/CNAME` with the domain, then configure DNS:

```text
ALIAS or ANAME apex -> baditaflorin.github.io
CNAME www -> baditaflorin.github.io
```

GitHub Pages does not support `_headers` or `_redirects`; the app uses `404.html` as the SPA fallback.
