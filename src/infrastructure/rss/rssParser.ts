import { type X2jOptions, XMLParser } from 'fast-xml-parser';
import type { FeedItem, ParsedFeedRoot } from '../../domain/article';
import { error } from '../../utils/logger';

export interface RSSParser {
  parse(xmlText: string): FeedItem[];
}

/**
 * XMLをパースしてフィードアイテムの配列を返すRSSParserの実装。
 * - Atom形式、RSS 2.0形式、RSS 1.0形式のフィードに対応する。
 * - フィードのルート要素やエントリー要素の構造を解析して、記事アイテムを抽出する。
 * - フィードの形式が不明な場合はエラーをスローする。
 */
export class XMLRSSParser implements RSSParser {
  private parser: XMLParser;

  constructor(options?: X2jOptions) {
    this.parser = new XMLParser(options);
  }

  /**
   * XMLテキストをパースしてフィードアイテムの配列を返す。
   * - Atom形式、RSS 2.0形式、RSS 1.0形式のフィードに対応する。
   * - フィードのルート要素やエントリー要素の構造を解析して、記事アイテムを抽出する。
   * - フィードの形式が不明な場合はエラーをスローする。
   * @param xmlText フィードのXMLテキスト
   * @returns フィードアイテムの配列
   * @throws エラーが発生した場合はエラーをスローする。
   */
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
        throw new Error('Unknown feed format; not Atom or RSS?');
      }

      return entries;
    } catch (err) {
      error('Failed to parse RSS XML', err);
      throw err;
    }
  }

  private ensureArray<T>(item: T | T[] | undefined): T[] {
    if (item == null) {
      return [];
    }
    return Array.isArray(item) ? item : [item];
  }
}
