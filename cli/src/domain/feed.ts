/** フィード設定 */
export interface FeedConfig {
  name: string;
  url: string;
  cover: string;
}

type NotionTitle = { title: Array<{ plain_text: string }> };

type NotionUrl = { id: string; type: string; url: string };

type NotionFile = {
  id: string;
  type: string;
  files: Array<{
    type: 'file' | 'external';
    file?: {
      url: string;
    };
    external?: {
      url: string;
    };
  }>;
};

/** Notionのフィード設定 */
export interface NotionFeedConfig {
  name: NotionTitle;
  rss: NotionUrl;
  cover: NotionFile;
}
