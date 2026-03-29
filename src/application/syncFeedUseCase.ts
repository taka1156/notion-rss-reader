import type { FeedEntry, FeedItem, RssItem } from '../domain/article';
import type { FeedConfig } from '../domain/feed';
import type { NotionRepository } from '../infrastructure/notion/notionFeedRepository';
import type { RSSFetcher } from '../infrastructure/rss/rssFetcher';
import type { RSSParser } from '../infrastructure/rss/rssParser';
import { error, info, warn } from '../utils/logger';

export interface SyncFeedUseCase {
  execute(): Promise<void>;
}

/**
 * フィードを同期するユースケースの実装。
 * - Notionからフィード設定と既存記事URLを取得する。
 * - 各フィードのURLからRSS/Atomを取得し、記事アイテムをパースする。
 * - 既存URLと照合して新しい記事のみをNotionに保存する。
 * - 個別のフィードや記事でエラーが発生しても、処理は続行する。
 * - ログを詳細に記録して、処理の進行状況やエラーを把握できるようにする。
 */
export class SyncFeedUseCaseImpl implements SyncFeedUseCase {
  constructor(
    private notionRepo: NotionRepository,
    private rssFetcher: RSSFetcher,
    private rssParser: RSSParser,
  ) {}

  async execute(): Promise<void> {
    info('Starting feed synchronization...');

    try {
      const feedConfigs = await this.notionRepo.getFeedConfigs();
      if (!feedConfigs.length) {
        info('No feed configs found.');
        return;
      }

      const existingUrls = await this.notionRepo.getExistingArticleUrls();
      info(
        `Found ${feedConfigs.length} feeds and ${existingUrls.size} existing articles`,
      );

      for (const feed of feedConfigs) {
        await this.processFeed(feed, existingUrls);
      }

      info('Feed synchronization completed.');
    } catch (err) {
      error('Feed synchronization failed', err);
      throw err;
    }
  }

  /**
   *　フィードごとに記事を処理する。
   * 個別のフィードでエラーが発生しても、他のフィードの処理は続行する。
   * @param feed フィードの設定
   * @param existingUrls 既に保存されている記事のURLセット。新しい記事を追加するたびに更新される。
   * @returns Promise<void>
   * @throws エラーが発生した場合はログに記録するが、処理は続行する。
   * @description
   * - フィードのURLからXMLを取得し、パースして記事アイテムのリストを得る。
   * - 各アイテムをFeedEntryに変換し、既存のURLと照合して新しい記事のみを抽出する。
   * - 新しい記事をNotionに保存し、保存成功したURLはexistingUrlsセットに追加する。
   * - 個別の記事保存でエラーが発生しても、他の記事やフィードの処理は続行する。
   */
  private async processFeed(
    feed: FeedConfig,
    existingUrls: Set<string>,
  ): Promise<void> {
    try {
      info(`Processing ${feed.name} (${feed.url})`);

      const xmlText = await this.rssFetcher.fetchFeed(feed.url);
      const rawItems = this.rssParser.parse(xmlText) as FeedItem[];

      const entries = rawItems
        .map((item) => this.convertToFeedEntry(item, feed.name))
        .filter(
          (entry): entry is FeedEntry =>
            entry !== null && !existingUrls.has(entry.url),
        );

      for (const entry of entries) {
        try {
          await this.notionRepo.saveArticle(entry);
          existingUrls.add(entry.url);
          info(`Added article: ${entry.title}`);
        } catch (saveErr) {
          error(`Failed to save article ${entry.title}`, saveErr);
          // 個別の保存失敗は続行
        }
      }

      info(`Processed ${entries.length} new articles from ${feed.name}`);
    } catch (err) {
      warn(`Failed to process feed ${feed.name}`, err);
      // 個別のフィード失敗は続行
    }
  }

  /**
   * RSS/AtomのアイテムをFeedEntryに変換する。
   * URLが抽出できない場合はnullを返す。
   * @param item RSS/Atomのアイテム
   * @param sourceName フィードの名前（sourceName）を引数として受け取るように変更
   * @returns FeedEntryオブジェクト、URLが抽出できない場合はnull
   */
  private convertToFeedEntry(
    item: FeedItem,
    sourceName: string,
  ): FeedEntry | null {
    // 簡略化のため、元のconvertFeedItemToEntryをここにインライン
    // 本来はdomain serviceや別のコンバーターに分けるべき
    const title = this.stringifyText(item.title) || 'Untitled';
    const url = this.extractUrl(item);

    if (!url) {
      return null;
    }

    const publishedAt = this.toNotionDate(
      this.stringifyText(
        ('published' in item ? item.published : undefined) ??
          ('pubDate' in item ? item.pubDate : undefined) ??
          ('dc:date' in item ? (item as RssItem)['dc:date'] : undefined),
      ) || this.stringifyText(item.updated),
    );

    const updatedAt = this.toNotionDate(
      this.stringifyText(item.updated) || (publishedAt?.start ?? ''),
    );

    return {
      title,
      url,
      publishedAt,
      updatedAt,
      sourceName,
    };
  }

  /**
   * RSS/AtomのアイテムからURLを抽出する。
   * @param item RSS/Atomのアイテム
   * @returns URL文字列、抽出できない場合は空文字
   */
  private extractUrl(item: FeedItem): string {
    const link = item.link;
    if (typeof link === 'string') {
      return link.trim();
    }

    if (Array.isArray(link)) {
      const alt = link.find(
        (l) => typeof l === 'object' && (l.rel === 'alternate' || !l.rel),
      );
      if (alt) {
        return typeof alt === 'string'
          ? alt
          : (alt.href || alt.url || '').trim();
      }
      return this.stringifyText(link[0] as string);
    }

    if (link && typeof link === 'object') {
      return (link.href || link.url || '').trim();
    }

    if (item.guid) {
      return this.stringifyText(item.guid);
    }

    return '';
  }

  /**
   * RSS/Atomのテキストノードを文字列に変換する。
   * @param value 文字列、オブジェクト、またはnull/undefined
   * @returns 文字列に変換された値。null/undefinedの場合は空文字。
   */
  private stringifyText(value?: string | object | null): string {
    if (value == null) {
      return '';
    }
    if (typeof value === 'string') {
      return value.trim();
    }
    if (
      typeof value === 'object' &&
      '#text' in value &&
      typeof value['#text'] === 'string'
    ) {
      return value['#text'].trim();
    }

    return String(value).trim();
  }

  /**
   * RSS/Atomの日付文字列をNotionのDateプロパティ形式に変換する。
   * @param dateString RSS/Atomの日付文字列
   * @returns NotionのDateプロパティ形式（{ start: 'YYYY-MM-DD' }）またはnull
   */
  private toNotionDate(dateString?: string) {
    if (!dateString) {
      return null;
    }

    const d = new Date(dateString);

    if (Number.isNaN(d.getTime())) {
      return null;
    }

    return { start: d.toISOString().split('T')[0] };
  }
}
