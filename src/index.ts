import dotenv from "dotenv";
import { Client } from "@notionhq/client";
import fetch from "cross-fetch";
import { XMLParser } from "fast-xml-parser";
import {
  FeedConfig,
  FeedEntry,
  XmlTextNode,
  AtomEntry,
  RssItem,
  ParsedFeedRoot,
} from "./types/common";
import {
  NotionDatabaseQueryResult,
  NotionReaderQueryResult,
} from "./types/notion";

dotenv.config();

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_FEED_DB_ID =
  process.env.NOTION_FEED_DB_ID ||
  process.env.NOTION_FEEDER_DATABASE_ID ||
  process.env.NOTION_FEED_DATABASE_ID;
const NOTION_READER_DB_ID =
  process.env.NOTION_READER_DB_ID ||
  process.env.NOTION_READER_DATABASE_ID ||
  process.env.NOTION_READ_DATABASE_ID;

console.log("NOTION_TOKEN", Boolean(NOTION_TOKEN));
console.log("NOTION_FEED_DB_ID", NOTION_FEED_DB_ID);
console.log("NOTION_READER_DB_ID", NOTION_READER_DB_ID);

if (!NOTION_TOKEN || !NOTION_FEED_DB_ID || !NOTION_READER_DB_ID) {
  throw new Error(
    "Please set NOTION_TOKEN and a valid feed/reader DB ID in environment variables."
  );
}

const notion = new Client({ auth: NOTION_TOKEN });
const NOTION_API_BASE_URL = "https://api.notion.com/v1";

function normalizeUrl(url: string): string {
  return url.trim();
}

function toNotionDate(dateString?: string) {
  if (!dateString) return null;
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return null;
  return { start: d.toISOString().split("T")[0] };
}

function stringifyText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "object") {
    const textNode = value as XmlTextNode;
    const text = textNode["#text"] || (value as any)["text"];
    if (typeof text === "string") return text.trim();
    return String(value).trim();
  }
  return String(value).trim();
}

function ensuresArray<T>(item: T | T[] | undefined): T[] {
  if (item == null) return [];
  return Array.isArray(item) ? item : [item];
}

function parseFeedXml(xmlText: string, sourceName: string): FeedEntry[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
    textNodeName: "#text",
  });

  const root = parser.parse(xmlText) as ParsedFeedRoot;

  let entries: Array<AtomEntry | RssItem> = [];

  if (root.feed?.entry) {
    entries = ensuresArray(root.feed.entry);
  } else if (root.entry) {
    entries = ensuresArray(root.entry);
  } else if (root.rss?.channel?.item) {
    entries = ensuresArray(root.rss.channel.item);
  } else if (root.RDF?.item) {
    entries = ensuresArray(root.RDF.item);
  } else if (root.channel?.item) {
    entries = ensuresArray(root.channel.item);
  }

  if (!entries.length) throw new Error("Unknown feed format; not Atom or RSS?");

  return entries
    .map<FeedEntry>((entry) => {
      const atomEntry = entry as AtomEntry;
      const rssItem = entry as RssItem;

      const title = stringifyText(atomEntry.title ?? rssItem.title) || "Untitled";

      let url = "";
      const link = atomEntry.link ?? rssItem.link;

      if (typeof link === "string") {
        url = link;
      } else if (Array.isArray(link)) {
        const alt = link.find((item) => {
          if (typeof item === "string") return false;
          return item.rel === "alternate" || !item.rel;
        });
        if (alt) {
          if (typeof alt === "string") {
            url = alt;
          } else {
            url = alt.href || alt.url || "";
          }
        } else {
          url = stringifyText(link[0]);
        }
      } else if (link && typeof link === "object") {
        url = link.href || link.url || "";
      }

      if (!url && rssItem.guid) {
        url = stringifyText(rssItem.guid);
      }

      const publishedAt =
        stringifyText(atomEntry.published ?? rssItem.pubDate ?? rssItem["dc:date"]) ||
        stringifyText(atomEntry.updated ?? rssItem.updated);

      const updatedAt =
        stringifyText(atomEntry.updated) ||
        stringifyText(rssItem.updated) ||
        publishedAt;

      return {
        title,
        url: normalizeUrl(url),
        publishedAt: publishedAt || undefined,
        updatedAt: updatedAt || undefined,
        sourceName,
      };
    })
    .filter((e) => Boolean(e.url));
}

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

async function createReaderPage(entry: FeedEntry): Promise<void> {
  await notion.pages.create({
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
  console.log("Fetching feed configs from Notion...");
  const feedConfigs = await getFeedConfigs();

  if (!feedConfigs.length) {
    console.log("No feed configs found in the feed database.");
    return;
  }

  console.log(`Feed configs: ${feedConfigs.map((f) => `${f.name}: ${f.url}`).join(", ")}`);

  for (const feed of feedConfigs) {
    try {
      console.log(`Processing ${feed.name} (${feed.url})`);
      const res = await fetch(feed.url);
      if (!res.ok) {
        console.warn(`Failed to fetch ${feed.url}: ${res.status}`);
        continue;
      }

      const feedText = await res.text();
      const entries = parseFeedXml(feedText, feed.name);

      for (const entry of entries) {
        if (!entry.url) continue;

        const exists = await readerEntryExists(entry.url);
        if (exists) continue;

        await createReaderPage(entry);
        console.log(`Added article: ${entry.title} (${entry.url})`);
      }
    } catch (error) {
      console.error(`Failed to process ${feed.name}`, error);
    }
  }

  console.log("Done.");
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});
