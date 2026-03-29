import fetch from 'cross-fetch';
import { error } from '../../utils/logger';

export interface RSSFetcher {
  fetchFeed(url: string): Promise<string>;
}

/**
 * HTTPを使用してRSS/Atomフィードを取得する実装。
 * - fetch APIを使用して指定されたURLからフィードのXMLテキストを取得する。
 * - タイムアウトを設定して、応答が遅い場合にリクエストを中止する。
 * - レスポンスが正常でない場合はエラーをスローする。
 */
export class HTTPRSSFetcher implements RSSFetcher {
  private timeout = 10000; // 10秒

  /**
   * 指定されたURLからRSS/Atomフィードを取得する。
   * - タイムアウトを設定して、応答が遅い場合にリクエストを中止する。
   * - レスポンスが正常でない場合はエラーをスローする。
   * @param url フィードのURL
   * @returns フィードのXMLテキスト
   * @throws エラーが発生した場合はエラーをスローする。
   */
  async fetchFeed(url: string): Promise<string> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Notion-RSS-Reader/1.0',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const text = await response.text();
      return text;
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          throw new Error(`Request timeout for ${url}`);
        }
        error(`Failed to fetch RSS from ${url}`, err);
        throw err;
      }
      throw new Error(`Unknown error fetching ${url}`);
    }
  }
}
