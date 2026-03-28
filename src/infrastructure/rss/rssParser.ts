import { X2jOptions, XMLParser } from "fast-xml-parser";
import { FeedItem, ParsedFeedRoot } from "../../domain/article";
import { error } from "../../utils/logger";

export interface RSSParser {
    parse(xmlText: string): FeedItem[];
}

export class XMLRSSParser implements RSSParser {
    private parser: XMLParser;

    constructor(options?: X2jOptions) {
        this.parser = new XMLParser(options);
    }

    parse(xmlText: string): FeedItem[] {
        try {
            const root = this.parser.parse(xmlText) as ParsedFeedRoot;

            let entries: FeedItem[] = [];

            if (root.feed?.entry) {
                entries = this.ensureArray(root.feed.entry);
            } else if (root.entry) {
                entries = this.ensureArray(root.entry);
            } else if (root.rss?.channel?.item) {
                entries = this.ensureArray(root.rss.channel.item);
            } else if (root.RDF?.item) {
                entries = this.ensureArray(root.RDF.item);
            } else if (root.channel?.item) {
                entries = this.ensureArray(root.channel.item);
            }

            if (!entries.length) {
                throw new Error("Unknown feed format; not Atom or RSS?");
            }

            return entries;
        } catch (err) {
            error("Failed to parse RSS XML", err);
            throw err;
        }
    }

    private ensureArray<T>(item: T | T[] | undefined): T[] {
        if (item == null) return [];
        return Array.isArray(item) ? item : [item];
    }
}