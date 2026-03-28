import fetch from "cross-fetch";
import { error } from "../../utils/logger";

export interface RSSFetcher {
    fetchFeed(url: string): Promise<string>;
}

export class HTTPRSSFetcher implements RSSFetcher {
    private timeout = 10000; // 10秒

    async fetchFeed(url: string): Promise<string> {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);

            const response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Notion-RSS-Reader/1.0'
                }
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