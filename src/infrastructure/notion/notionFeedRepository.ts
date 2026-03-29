import type {
  CreatePageParameters,
  CreatePageResponse,
  PageObjectResponse,
  QueryDataSourceResponse,
} from '@notionhq/client';
import type { FeedEntry } from '../../domain/article';
import type { FeedConfig, NotionFeedConfig } from '../../domain/feed';
import type { NotionClient } from './notionClient';

export interface NotionRepository {
  getFeedConfigs(): Promise<FeedConfig[]>;
  getExistingArticleUrls(): Promise<Set<string>>;
  saveArticle(entry: FeedEntry): Promise<CreatePageResponse>;
  clearAllArticles(): Promise<void>;
}

/**
 * Notionをデータストアとして使用するリポジトリの実装。
 * - フィード設定と既存記事URLの取得、記事の保存をNotion APIを通じて行う。
 * - フィード設定は「Feeder」データベースから、既存記事URLは「Reader」データベースから取得する。
 * - 記事の保存は「Reader」データベースに対して行う。
 * - データの取得と保存の際には、APIレスポンスの構造に合わせて適切にプロパティを抽出する。
 */
export class NotionFeedRepository implements NotionRepository {
  constructor(
    private client: NotionClient,
    private feederDatabaseId: string,
    private readerDatabaseId: string,
  ) {}

  /**
   * Notionの「Feeder」データベースからフィード設定を取得する。
   * - データベースのクエリをページネーションしながら全てのページを取得する。
   * - 各ページから「Name」と「URL」プロパティを抽出し、フィード設定の配列を構築する。
   * @returns フィード設定の配列
   * @throws エラーが発生した場合はログに記録し、リトライする。
   * 最大リトライ回数を超えた場合はエラーをスローする。
   */
  async getFeedConfigs(): Promise<FeedConfig[]> {
    const feedConfigs: FeedConfig[] = [];
    let hasMore = true;
    let nextCursor: string | null = null;

    while (hasMore) {
      const response: QueryDataSourceResponse = await this.client.queryDatabase(
        {
          data_source_id: this.feederDatabaseId,
          page_size: 100,
          result_type: 'page',
          ...(nextCursor && { start_cursor: nextCursor }),
        },
      );

      const pages = response.results.filter(
        (item): item is PageObjectResponse => item.object === 'page',
      );

      for (const page of pages) {
        const nameProp = this.getPropertyValue<NotionFeedConfig['name']>(
          page,
          'Name',
        );
        const urlProp = this.getPropertyValue<NotionFeedConfig>(page, 'URL');

        if (nameProp?.title?.[0]?.plain_text && urlProp.url) {
          feedConfigs.push({
            name: nameProp.title[0].plain_text,
            url: urlProp.url,
          });
        }
      }

      hasMore = response.has_more;
      nextCursor = response.next_cursor ?? null;
    }

    return feedConfigs;
  }

  /**
   * Notionの「Reader」データベースから既存記事のURLを取得する。
   * - データベースのクエリをページネーションしながら全てのページを取得する。
   * - 各ページから「URL」プロパティを抽出し、URLのセットを構築する。
   * @returns 既存記事のURLセット
   * @throws エラーが発生した場合はログに記録し、リトライする。
   * 最大リトライ回数を超えた場合はエラーをスローする。
   */
  async getExistingArticleUrls(): Promise<Set<string>> {
    const urls = new Set<string>();
    let hasMore = true;
    let nextCursor: string | null = null;

    while (hasMore) {
      const response: QueryDataSourceResponse = await this.client.queryDatabase(
        {
          data_source_id: this.readerDatabaseId,
          page_size: 100,
          result_type: 'page',
          ...(nextCursor && { start_cursor: nextCursor }),
        },
      );

      const pages = response.results.filter(
        (item): item is PageObjectResponse => item.object === 'page',
      );

      for (const page of pages) {
        const urlProp = this.getPropertyValue<NotionFeedConfig>(page, 'URL');
        if (urlProp?.url) {
          urls.add(urlProp.url);
        }
      }

      hasMore = response.has_more;
      nextCursor = response.next_cursor ?? null;
    }

    return urls;
  }

  /**
   * Notionの「Reader」データベースに新しい記事を保存する。
   * - 記事のタイトル、URL、ソース名、公開日時、更新日時をページのプロパティとして設定する。
   * - API呼び出しにリトライロジックが組み込まれている。
   * @param entry 保存する記事のエントリ
   * @returns ページ作成のレスポンスデータ
   * @throws エラーが発生した場合はログに記録し、リトライする。
   * 最大リトライ回数を超えた場合はエラーをスローする。
   */
  async saveArticle(entry: FeedEntry): Promise<CreatePageResponse> {
    const properties: CreatePageParameters['properties'] = {
      title: { title: [{ text: { content: entry.title } }] },
      URL: { url: entry.url },
      source: { rich_text: [{ text: { content: entry.sourceName } }] },
    };

    if (entry.publishedAt) {
      properties.createdAt = { date: entry.publishedAt };
    }
    if (entry.updatedAt) {
      properties.updatedAt = { date: entry.updatedAt };
    }

    return this.client.createPage({
      parent: { data_source_id: this.readerDatabaseId },
      properties,
    });
  }

  /**
   * Notionの「Reader」データベース内の全記事をアーカイブ（リセット）する。
   * - データベースのクエリをページネーションしながら全ページIDを収集し、順次アーカイブする。
   */
  async clearAllArticles(): Promise<void> {
    let hasMore = true;
    let nextCursor: string | null = null;

    while (hasMore) {
      const response: QueryDataSourceResponse = await this.client.queryDatabase(
        {
          data_source_id: this.readerDatabaseId,
          page_size: 100,
          result_type: 'page',
          ...(nextCursor && { start_cursor: nextCursor }),
        },
      );

      const pages = response.results.filter(
        (item): item is PageObjectResponse => item.object === 'page',
      );

      for (const page of pages) {
        await this.client.archivePage(page.id);
      }

      hasMore = response.has_more;
      nextCursor = response.next_cursor ?? null;
    }
  }

  private getPropertyValue<T>(page: PageObjectResponse, propertyName: string) {
    const properties = page.properties;
    return properties[propertyName] as T;
  }
}
