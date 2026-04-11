# notion-rss-reader

[English](README.md)

Notion のフィードを同期し、React フロントエンドで記事を閲覧できるシンプルな RSS リーダーです。

## Overview

- **CLI** (`cli/`): Notion の Feeder データベースからフィード設定を取得し、RSS/Atom を取得・パースして Reader データベースへ保存。`entries.json` を出力します。
- **Frontend** (`frontend/`): `entries.json` を読み込み、カテゴリフィルタ・検索付きで記事一覧を表示する React アプリ (Vite)。GitHub Pages にデプロイされます。

## Architecture

pnpm workspaces によるモノレポ構成です。

```
notion-rss-reader/
├── cli/
│   └── src/
│       ├── domain/          # ビジネスエンティティ (Feed, Article)
│       ├── application/     # ユースケース (SyncFeedUseCase)
│       └── infrastructure/  # 外部連携 (Notion API, RSS fetch/parse)
└── frontend/                # React (Vite) フロントエンド
```

## Notion Database Setup

### Feeder Database (フィード設定)
| Name | URL |
|------|-----|
| Qiita Trends | https://qiita.com/popular-items/feed.atom |
| Zenn Trends | https://zenn.dev/feed |

### Reader Database (記事)
| Title | URL | Created At | Updated At | Source |
|-------|-----|------------|------------|--------|
| Article Title | https://example.com | 2024-01-01 | 2024-01-01 | Qiita Trends |

## Environment Variables

`.env.example` をコピーして値を設定してください。

```bash
cp .env.example .env
```

```
NOTION_TOKEN=your_notion_token
NOTION_FEEDER_DATASOURCE_ID=your_feeder_datasource_id
NOTION_READER_DATASOURCE_ID=your_reader_datasource_id
ENTRIES_JSON_OUTPUT=../frontend/public/entries.json  # 省略可
```

## Usage

```bash
# 依存関係のインストール
pnpm install

# CLI: RSS 同期
make cli-start

# CLI: Reader DB をリセットしてから同期
make cli-start-reset

# CLI: デバッグモード
make cli-dev

# フロントエンド: 開発サーバー起動
make front-dev

# フロントエンド: ビルド
make front-build
```

## CI/CD

GitHub Actions (`batch.yaml`) により、3 日ごと (JST 0:00) または `master` へのプッシュ時に自動実行されます。

1. RSS 同期 (`make cli-start-reset`)
2. フロントエンドビルド (`make front-build`)
3. GitHub Pages へデプロイ (`gh-pages` ブランチ)

## Testing

```bash
pnpm test
```

## Lint / Format

```bash
# チェック
make check

# 自動修正
make format
```
