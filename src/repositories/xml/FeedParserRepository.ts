import { AtomEntry, ParsedFeedRoot, RssItem } from "../../types/entity";
import { XMLParserClientType } from "../../types/interface";
import { BaseXMLRepository } from "./BaseXMLRepository";

function ensuresArray<T>(item: T | T[] | undefined): T[] {
  if (item == null) return [];
  return Array.isArray(item) ? item : [item];
}

export class FeedParserRepository extends BaseXMLRepository {
  constructor(xmlc: XMLParserClientType) {
    super({ xmlc });
  }

  parseFeedXml(xmlText: string): Array<AtomEntry | RssItem> {

    const root = this.xmlc.parser.parse(xmlText) as ParsedFeedRoot;

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

    if (!entries.length) {
      throw new Error("Unknown feed format; not Atom or RSS?");
    }

    return entries;
  }
}
