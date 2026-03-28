export interface FeedConfig {
  name: string;
  url: string;
}

export interface FeedEntry {
  title: string;
  url: string;
  publishedAt?: string;
  updatedAt?: string;
  sourceName: string;
}

export interface XmlTextNode {
  "#text"?: string;
}

export interface AtomLink {
  rel?: string;
  href?: string;
  url?: string;
}

export interface AtomEntry {
  title?: string | XmlTextNode;
  link?: string | AtomLink | Array<AtomLink | string>;
  published?: string;
  updated?: string;
  guid?: string;
}

export interface RssItem {
  title?: string;
  link?: string;
  guid?: string;
  pubDate?: string;
  "dc:date"?: string;
  updated?: string;
}

export type ParsedFeedRoot = {
  feed?: { entry?: AtomEntry | AtomEntry[] };
  entry?: AtomEntry | AtomEntry[];
  rss?: { channel?: { item?: RssItem | RssItem[] } };
  channel?: { item?: RssItem | RssItem[] };
  RDF?: { item?: RssItem | RssItem[] };
};

