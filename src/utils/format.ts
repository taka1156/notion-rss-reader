import { XMLParser } from "fast-xml-parser";
import {
  FeedConfig,
  FeedEntry,
  XmlTextNode,
  AtomEntry,
  RssItem,
  ParsedFeedRoot,
} from "../types/common";

export function normalizeUrl(url: string): string {
  return url.trim();
}

export function toNotionDate(dateString?: string) {
  if (!dateString) return null;
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return null;
  return { start: d.toISOString().split("T")[0] };
}

export function stringifyText(value: unknown): string {
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

export function ensuresArray<T>(item: T | T[] | undefined): T[] {
  if (item == null) return [];
  return Array.isArray(item) ? item : [item];
}

export function parseFeedXml(xmlText: string, sourceName: string): FeedEntry[] {
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
        url = (link as any).href || (link as any).url || "";
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
