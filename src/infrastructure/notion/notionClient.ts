import {
  Client,
  type CreatePageParameters,
  type CreatePageResponse,
  type QueryDataSourceParameters,
  type QueryDataSourceResponse,
  type UpdatePageParameters,
  type UpdatePageResponse,
} from '@notionhq/client';
import { error, warn } from '../../utils/logger';

export type WithAuth<P> = P & {
  auth?: string;
};

/**
 * Notion APIクライアントをラップするクラス。
 * - API呼び出しにリトライロジックを追加して、レートリミットや一時的なエラーに対処する。
 * - クエリ、ページ作成、ページ更新の各操作を提供する。
 * - エラーが発生した場合はログに記録し、必要に応じてリトライする。
 */
export class NotionClient {
  private client: Client;
  private retryDelay = 1000; // 1秒
  private maxRetries = 3;

  constructor(notionToken: string) {
    this.client = new Client({
      auth: notionToken,
      notionVersion: '2025-09-03',
    });
  }

  /**
   * 指定された関数をリトライロジックで実行するヘルパー関数。
   * @param fn リトライ対象の非同期関数
   * @param operation 操作の説明（ログ用）
   * @returns 関数の実行結果
   */
  private async withRetry<T>(
    fn: () => Promise<T>,
    operation: string,
  ): Promise<T> {
    let lastError: unknown = new Error('Unknown error');
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err;
        // エラー内容を必ずwarnで出す
        warn(`${operation} error:`, err);
        if (this.isRateLimitError(err)) {
          const delay = this.retryDelay * attempt;
          warn(
            `${operation} rate limited, retrying in ${delay}ms (attempt ${attempt}/${this.maxRetries})`,
          );
          await this.sleep(delay);
          continue;
        }
        if (attempt === this.maxRetries) {
          break;
        }
        warn(
          `${operation} failed, retrying (attempt ${attempt}/${this.maxRetries}):`,
          err,
        );
        await this.sleep(this.retryDelay);
      }
    }

    error(`${operation} failed after ${this.maxRetries} attempts`, lastError);

    if (lastError instanceof Error) {
      throw lastError;
    } else {
      throw new Error(String(lastError));
    }
  }

  /**
   * エラーがレートリミットによるものかを判定する。
   * @param err エラーオブジェクト
   * @returns レートリミットエラーの場合はtrue、それ以外はfalse
   */
  private isRateLimitError(err: unknown): boolean {
    if (typeof err === 'object' && err !== null) {
      const e = err as { status?: unknown; code?: unknown };
      return e.status === 429 || e.code === 'rate_limited';
    }
    return false;
  }

  /**
   * 指定された時間だけ待機する。
   * @param ms 待機時間（ミリ秒）
   * @returns Promise<void>
   */
  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Notionのデータベースをクエリする。
   * @param args クエリのパラメータ（認証情報を含む）
   * @returns クエリのレスポンスデータ
   * @throws エラーが発生した場合はログに記録し、リトライする。
   * 最大リトライ回数を超えた場合はエラーをスローする。
   */
  async queryDatabase(
    args: WithAuth<QueryDataSourceParameters>,
  ): Promise<QueryDataSourceResponse> {
    return this.withRetry(
      () => this.client.dataSources.query(args),
      'queryDatabase',
    );
  }

  /**
   * Notionのページを作成する。
   * @param args ページ作成のパラメータ（認証情報を含む）
   * @returns ページ作成のレスポンスデータ
   * @throws エラーが発生した場合はログに記録し、リトライする。
   * 最大リトライ回数を超えた場合はエラーをスローする。
   */
  async createPage(
    args: WithAuth<CreatePageParameters>,
  ): Promise<CreatePageResponse> {
    return this.withRetry(() => this.client.pages.create(args), 'createPage');
  }

  /**
   * Notionのページを更新する。
   * @param params ページ更新のパラメータ（認証情報を含む）
   * @returns ページ更新のレスポンスデータ
   * @throws エラーが発生した場合はログに記録し、リトライする。
   * 最大リトライ回数を超えた場合はエラーをスローする。
   */
  async updatePage(
    params: WithAuth<UpdatePageParameters>,
  ): Promise<UpdatePageResponse> {
    return this.withRetry(() => this.client.pages.update(params), 'updatePage');
  }
}
