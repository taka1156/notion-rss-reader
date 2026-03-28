# notion-rss-reader

A simple RSS reader for Notion with clean DDD architecture.

## Overview

This application synchronizes RSS/Atom feeds from Notion database and saves articles to another Notion database.

## Architecture

This project follows Domain-Driven Design (DDD) principles:

- **Domain**: Business entities and rules (Feed, Article)
- **Application**: Use cases (SyncFeedUseCase)
- **Infrastructure**: External concerns (Notion API, RSS fetching/parsing)

## Features

- Fetches RSS/Atom feeds from configured sources
- Parses and normalizes article data
- Saves new articles to Notion database
- Handles errors gracefully with retries
- Environment variable validation

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

Create a `.env` file with:

```
NOTION_TOKEN=your_notion_token
NOTION_FEEDER_DATASOURCE_ID=your_feeder_database_id
NOTION_READER_DATASOURCE_ID=your_reader_database_id
```

## Usage

```bash
npm install
npm run build
npm start
```

For debug mode:
```bash
npm run start-dev
```

## Testing

```bash
npm test
```
