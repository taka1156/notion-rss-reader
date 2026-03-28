# notion-rss-reader


1. qiitaやzennのRSSやatomリンクをnotionのfeedデータベースから拾ってください
2. 取得した結果をreaderの形式に合うようにデータ整形します。
3. notionのreaderのテーブルに追加します


feederのテーブル形式(例)
|Name| rss or atom URL|
|---|---|
|Qiita トレンド| https://qiita.com/popular-items/feed.atom|
|Zenn トレンド| https://zenn.dev/feed|


readerのテーブル形式(例)
|title|URL|createdAt|updatedAt|source|
|---|---|---|---|---|
|記事タイトル | https://qiita.com/username/article | 2024-01-01|2024-06-01|Qiita トレンド|
|記事タイトル | https://zenn.dev/username/article | 2024-01-01|2024-05-01|Zenn トレンド|

## Notion連携設定

### feeder（フィード設定）
- Name: テキストプロパティ（例：Qiita トレンド）
- rss or atom URL: URLプロパティ（例：https://qiita.com/popular-items/feed.atom）

`getFeedConfigs()`では次のプロパティ名を順に検索します。
- `Name`（優先）
- `名前`

URLフィールドは次の名称を順に検索します。
- `rss or atom URL`（優先）
- `URL`
- `Feed`

### reader（取得結果）
- title: タイトルプロパティ
- URL: URLプロパティ
- createdAt: 日付プロパティ（start）
- updatedAt: 日付プロパティ（start）
- source: リッチテキストプロパティ

`createReaderPage()`は上記プロパティへ書き込みます。

### 環境変数
- NOTION_TOKEN
- NOTION_FEED_DB_ID
- NOTION_READER_DB_ID
