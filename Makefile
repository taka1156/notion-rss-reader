# CLI
cli-ci:
	pnpm --filter @notion-rss-reader/cli install --frozen-lockfile
cli-dev:
	pnpm run --filter @notion-rss-reader/cli start:dev
cli-build:
	pnpm run --filter @notion-rss-reader/cli build
cli-start:
	pnpm run --filter @notion-rss-reader/cli start
cli-start-reset:
	pnpm run --filter @notion-rss-reader/cli start:reset
# FRONT
front-ci:
	pnpm --filter @notion-rss-reader/frontend install --frozen-lockfile
front-dev:
	pnpm run --filter @notion-rss-reader/frontend dev
front-build:
	pnpm run --filter @notion-rss-reader/frontend build
front-preview:
	pnpm run --filter @notion-rss-reader/frontend preview
# common
check:
	pnpm run lint
format:
	pnpm run lint:fix

