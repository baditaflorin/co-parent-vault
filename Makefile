.PHONY: help install-hooks dev build test test-integration smoke lint fmt pages-preview release clean hooks-pre-commit hooks-commit-msg hooks-pre-push

help:
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "%-22s %s\n", $$1, $$2}'

install-hooks: ## Wire local git hooks
	git config core.hooksPath .githooks
	chmod +x .githooks/*

dev: ## Run the Vite dev server
	npm run dev

build: ## Build the Pages-ready app into docs/
	npm run build

test: ## Run unit tests
	npm run test

test-integration: ## Run integration tests if present
	npm run test

smoke: ## Build, serve, and run Playwright smoke tests
	bash scripts/smoke.sh

lint: ## Run linters and type checks
	npm run lint
	npm run fmt:check
	npx tsc -b --pretty false
	npm audit --audit-level=high

fmt: ## Autoformat files
	npm run fmt

pages-preview: ## Serve docs/ locally as GitHub Pages would
	npm run build
	npm run preview -- --port 4173

release: ## Tag the current commit, e.g. make release VERSION=v0.1.0
	@test -n "$(VERSION)" || (echo "VERSION is required, e.g. make release VERSION=v0.1.0" && exit 1)
	git tag -a "$(VERSION)" -m "$(VERSION)"
	git push origin "$(VERSION)"

hooks-pre-commit:
	.githooks/pre-commit

hooks-commit-msg:
	@test -n "$(MSG)" || (echo "MSG is required" && exit 1)
	.githooks/commit-msg "$(MSG)"

hooks-pre-push:
	.githooks/pre-push

clean: ## Remove local build caches
	rm -rf node_modules/.vite coverage playwright-report test-results
