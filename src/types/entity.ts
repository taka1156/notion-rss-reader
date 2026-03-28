/** フィード設定 */
export interface FeedConfig {
  name: string;
  url: string;
}

/** Notion日付の構造 */
export interface NotionDate {
  start: string;
}

/** フィードエントリー */
export interface FeedEntry {
  title: string;
  url: string;
  publishedAt: NotionDate | null;
  updatedAt: NotionDate | null;
  sourceName: string;
}

/**
 * XMLのテキストノードを表すインターフェース。
 * XMLの要素がテキストのみを含む場合に使用される。
 */
export interface XmlTextNode {
  "#text"?: string;
}

/**
 * RSSやAtomのエントリーを表すインターフェース。
 * これらのフィード形式で共通するプロパティを定義している。
*/
export interface AtomLink {
  rel?: string;
  href?: string;
  url?: string;
}

export type AtomLinkOrString = AtomLink | string;

/**
 * AtomエントリーとRSSアイテムの両方を表すインターフェース。
 * これらのフィード形式で共通するプロパティを定義している。
 */
export interface AtomEntry {
  title?: string | XmlTextNode | null;
  link?: AtomLinkOrString | Array<AtomLinkOrString> | null;
  published?: string | null;
  updated?: string | null;
  guid?: string | null;
}

/**
 * RSSアイテムを表すインターフェース。
 * RSSフィード形式で特有のプロパティを定義している。
 */
export interface RssItem {
  title?: string | XmlTextNode | null;
  link?: string | null;
  guid?: string | null;
  pubDate?: string | null;
  "dc:date"?: string | null;
  updated?: string | null;
}

export type FeedItem = AtomEntry | RssItem;

/** 
 * フィードのルート要素を表すインターフェース。
 * Atomフィード、RSSフィード、RDFフィードなど、さまざまなフィード形式に対応するための構造を定義している。
 */
export interface ParsedFeedRoot {
  feed?: { entry?: AtomEntry | AtomEntry[] };
  entry?: AtomEntry | AtomEntry[];
  rss?: { channel?: { item?: RssItem | RssItem[] } };
  channel?: { item?: RssItem | RssItem[] };
  RDF?: { item?: RssItem | RssItem[] };
}

export interface FeedParserResult {
  entries: (AtomEntry | RssItem)[];
  format: "atom" | "rss" | "rdf" | "unknown";
}


