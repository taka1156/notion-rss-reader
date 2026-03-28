import 'dotenv/config'
import { setDebug, info, warn, error } from "./utils/logger";
import { NotionClient } from "./services/NotionClient";
import fetch from "cross-fetch";
import { parseFeedXml, toNotionDate } from "./utils/format";
import {
  FeedConfig,
  FeedEntry,
} from "./types/common";
import {
  NotionDatabaseQueryResult,
  NotionReaderQueryResult,
} from "./types/notion";

// debugモードの判定と設定
const debugMode = process.argv.includes("--debug") || process.env.DEBUG === "true";
setDebug(debugMode);

// 環境変数の読み込みと検証
const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_FEED_DB_ID = process.env.NOTION_FEED_DATABASE_ID;
const NOTION_READER_DB_ID = process.env.NOTION_READ_DATABASE_ID;

info("NOTION_TOKEN", Boolean(NOTION_TOKEN));
info("NOTION_FEED_DB_ID", NOTION_FEED_DB_ID);
info("NOTION_READER_DB_ID", NOTION_READER_DB_ID);

// 必要な環境変数が揃っているか確認
if (!NOTION_TOKEN || !NOTION_FEED_DB_ID || !NOTION_READER_DB_ID) {
  throw new Error(
    "Please set NOTION_TOKEN and a valid feed/reader DB ID in environment variables."
  );
}

const NOTION_API_BASE_URL = "https://api.notion.com/v1";

// NotionClientを初期化
const nc = new NotionClient(NOTION_TOKEN);

/**
 * Notionのフィードデータベースからフィード設定を取得する
 * @returns フィード設定の配列
 */
async function getFeedConfigs(): Promise<FeedConfig[]> {
  const feedConfigs: FeedConfig[] = [];
  let hasMore = true;
  let nextCursor: string | null = null;

  while (hasMore) {
    const resp = await fetch(
      `${NOTION_API_BASE_URL}/databases/${NOTION_FEED_DB_ID}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${NOTION_TOKEN}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          page_size: 100,
          start_cursor: nextCursor || undefined,
        }),
      }
    );

    if (!resp.ok) {
      const body = await resp.text();
      throw new Error(`Failed to query feed DB: ${resp.status} ${body}`);
    }

    const json = (await resp.json()) as NotionDatabaseQueryResult;

    for (const result of json.results) {
      const properties = result.properties || {};
      const nameProp = properties["Name"] || properties["名前"];
      const urlProp = properties["rss or atom URL"] || properties["URL"] || properties["Feed"];

      const name =
        nameProp?.title?.[0]?.plain_text ||
        nameProp?.rich_text?.[0]?.plain_text ||
        "";
      const url = urlProp?.url || urlProp?.rich_text?.[0]?.plain_text || "";

      if (!name || !url) continue;

      feedConfigs.push({ name, url });
    }

    hasMore = json.has_more;
    nextCursor = json.next_cursor || null;
  }

  return feedConfigs;
}

/**
 * 指定されたURLを持つ記事がリーダーデータベースに存在するか確認する
 * @param url 記事のURL
 * @returns 存在する場合はtrue、存在しない場合はfalse
 * @throws クエリの実行に失敗した場合はエラーをスロー
 */
async function readerEntryExists(url: string): Promise<boolean> {
  const response = await fetch(
    `${NOTION_API_BASE_URL}/databases/${NOTION_READER_DB_ID}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${NOTION_TOKEN}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filter: {
          property: "URL",
          url: { equals: url },
        },
        page_size: 1,
      }),
    }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to query reader DB: ${response.status} ${body}`);
  }

  const json = (await response.json()) as NotionReaderQueryResult;

  return (json.results?.length || 0) > 0;
}

/**
 * Notionのリーダーデータベースに新しい記事ページを作成する
 * @param entry 記事の情報を含むFeedEntryオブジェクト
 * @returns 作成されたページの情報を含むPromise
 * @throws ページの作成に失敗した場合はエラーをスロー
 */
async function createReaderPage(entry: FeedEntry): Promise<void> {
  await nc.createPage({
    parent: { database_id: NOTION_READER_DB_ID! },
    properties: {
      title: {
        title: [{ text: { content: entry.title } }],
      },
      URL: {
        url: entry.url,
      },
      createdAt: {
        date: toNotionDate(entry.publishedAt),
      },
      updatedAt: {
        date: toNotionDate(entry.updatedAt),
      },
      source: {
        rich_text: [{ text: { content: entry.sourceName } }],
      },
    },
  });
}

async function main() {
  info("Fetching feed configs from Notion...");
  const feedConfigs = await getFeedConfigs();

  if (!feedConfigs.length) {
    info("No feed configs found in the feed database.");
    return;
  }

  info(`Feed configs: ${feedConfigs.map((f) => `${f.name}: ${f.url}`).join(", ")}`);

  for (const feed of feedConfigs) {
    try {
      info(`Processing ${feed.name} (${feed.url})`);
      const res = await fetch(feed.url);
      if (!res.ok) {
        warn(`Failed to fetch ${feed.url}: ${res.status}`);
        continue;
      }

      const feedText = await res.text();
      const entries = parseFeedXml(feedText, feed.name);

      for (const entry of entries) {
        if (!entry.url) continue;

        const exists = await readerEntryExists(entry.url);
        if (exists) continue;

        await createReaderPage(entry);
        info(`Added article: ${entry.title} (${entry.url})`);
      }
    } catch (err) {
      error(`Failed to process ${feed.name}`, err);
    }
  }

  info("Done.");
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});
