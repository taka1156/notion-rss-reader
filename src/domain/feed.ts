/** フィード設定 */
export interface FeedConfig {
  name: string;
  url: string;
}

/** Notionのフィード設定 */
export interface NotionFeedConfig {
  name: { title: Array<{ plain_text: string }> };
  url: string;
}
