# notion-rss-reader

[日本語](README.ja.md)

A simple RSS reader for Notion that synchronizes feeds and displays articles via a React frontend.

## Overview

- **CLI** (`cli/`): Fetches feed configurations from a Notion Feeder database, retrieves and parses RSS/Atom feeds, saves articles to a Notion Reader database, and outputs `entries.json`.
- **Frontend** (`frontend/`): A React app (Vite) that reads `entries.json` and displays articles with category filtering and search. Deployed to GitHub Pages.

## Architecture

Monorepo with pnpm workspaces.

```
notion-rss-reader/
├── cli/
│   └── src/
│       ├── domain/          # Business entities (Feed, Article)
│       ├── application/     # Use cases (SyncFeedUseCase)
│       └── infrastructure/  # External concerns (Notion API, RSS fetch/parse)
└── frontend/                # React (Vite) frontend
```

## Notion Database Setup

### Feeder Database (Feed configurations)
| Name | URL |
|------|-----|
| Qiita Trends | https://qiita.com/popular-items/feed.atom |
| Zenn Trends | https://zenn.dev/feed |

### Reader Database (Articles)
| Title | URL | Created At | Updated At | Source |
|-------|-----|------------|------------|--------|
| Article Title | https://example.com | 2024-01-01 | 2024-01-01 | Qiita Trends |

## Environment Variables

Copy `.env.example` and fill in your values:

```bash
cp .env.example .env
```

```
NOTION_TOKEN=your_notion_token
NOTION_FEEDER_DATASOURCE_ID=your_feeder_datasource_id
NOTION_READER_DATASOURCE_ID=your_reader_datasource_id
ENTRIES_JSON_OUTPUT=../frontend/public/entries.json  # optional
```

## Usage

```bash
# Install dependencies
pnpm install

# CLI: sync RSS feeds
make cli-start

# CLI: reset Reader DB then sync
make cli-start-reset

# CLI: debug mode
make cli-dev

# Frontend: start dev server
make front-dev

# Frontend: build
make front-build
```

## CI/CD

GitHub Actions (`batch.yaml`) runs automatically every 3 days (JST 00:00) or on push to `master`:

1. Sync RSS feeds (`make cli-start-reset`)
2. Build frontend (`make front-build`)
3. Deploy to GitHub Pages (`gh-pages` branch)

## Testing

```bash
pnpm test
```

## Lint / Format

```bash
# Check
make check

# Auto-fix
make format
```
