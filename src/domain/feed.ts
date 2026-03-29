/** フィード設定 */
export interface FeedConfig {
  name: string;
  url: string;
}

export interface NotionFeedConfig {
  name: { title: Array<{ plain_text: string }> };
  url: string;
}
