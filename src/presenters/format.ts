import {
  FeedEntry,
  XmlTextNode,
  AtomEntry,
  RssItem,
} from "../types/entity";

/**
 * URLを正規化する関数。現在は単純に前後の空白を削除するだけですが、
 * 将来的にさらに複雑な正規化ロジックを追加することができます。
 * @param url 正規化するURL文字列
 * @returns 正規化されたURL文字列
 */
function normalizeUrl(url: string): string {
  return url.trim();
}

/**
 * 日付文字列をNotionのデータベースで使用できる形式に変換する関数。
 * 入力が無効な日付文字列の場合はnullを返します。
 * @param dateString 変換する日付文字列
 * @returns Notionのデータベースで使用できる形式の日付オブジェクト、またはnull
 */
function toNotionDate(dateString?: string) {
  if (!dateString) return null;
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return null;
  return { start: d.toISOString().split("T")[0] };
}

/**
 * 不明な型の値を文字列に変換する関数。nullやundefinedは空文字列に変換されます。
 * オブジェクトの場合、#textプロパティやtextプロパティを優先して文字列化します。
 * @param value 文字列化する値
 * @returns 文字列化された値
 */
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

/**
 * AtomEntryやRssItemなどのフィードアイテムを、Notionのデータベースに保存するためのFeedEntryオブジェクトに変換する関数。
 * URLが見つからない場合はnullを返します。
 * @param entry 変換するフィードアイテム（AtomEntryまたはRssItem）
 * @param sourceName フィードのソース名
 * @returns 変換されたFeedEntryオブジェクト、またはURLが見つからない場合はnull
 */
export function convertFeedItemToEntry(
  entry: AtomEntry | RssItem,
  sourceName: string
): FeedEntry | null {
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

  const rawPublishedAt =
    stringifyText(atomEntry.published ?? rssItem.pubDate ?? rssItem["dc:date"]) ||
    stringifyText(atomEntry.updated ?? rssItem.updated);
  const publishedAt = toNotionDate(rawPublishedAt);

  const rawUpdatedAt =
    stringifyText(atomEntry.updated) ||
    stringifyText(rssItem.updated) ||
    publishedAt?.start;
  const updatedAt = toNotionDate(rawUpdatedAt);

  if (!url) {
    return null;
  }

  return {
    title,
    url: normalizeUrl(url),
    publishedAt,
    updatedAt,
    sourceName,
  };
}


