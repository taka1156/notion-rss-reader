import { QueryDataSourceResponse, CreatePageResponse, PageObjectResponse } from "@notionhq/client";
import { NotionClient } from "./notionClient";
import { FeedConfig } from "../../domain/feed";
import { FeedEntry } from "../../domain/article";

export interface NotionRepository {
    getFeedConfigs(): Promise<FeedConfig[]>;
    getExistingArticleUrls(): Promise<Set<string>>;
    saveArticle(entry: FeedEntry): Promise<CreatePageResponse>;
}

export class NotionFeedRepository implements NotionRepository {
    constructor(
        private client: NotionClient,
        private feederDatabaseId: string,
        private readerDatabaseId: string
    ) {}

    async getFeedConfigs(): Promise<FeedConfig[]> {
        const feedConfigs: FeedConfig[] = [];
        let hasMore = true;
        let nextCursor: string | null = null;

        while (hasMore) {
            const response: QueryDataSourceResponse = await this.client.queryDatabase({
                data_source_id: this.feederDatabaseId,
                page_size: 100,
                result_type: "page",
                ...(nextCursor && { start_cursor: nextCursor })
            });

            const pages = response.results.filter((item): item is PageObjectResponse => item.object === "page");

            for (const page of pages) {
                const nameProp = this.getPropertyValue(page, "Name");
                const urlProp = this.getPropertyValue(page, "URL");

                if (nameProp?.title?.[0]?.plain_text && urlProp?.url) {
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

    async getExistingArticleUrls(): Promise<Set<string>> {
        const urls = new Set<string>();
        let hasMore = true;
        let nextCursor: string | null = null;

        while (hasMore) {
            const response: QueryDataSourceResponse = await this.client.queryDatabase({
                data_source_id: this.readerDatabaseId,
                page_size: 100,
                result_type: "page",
                ...(nextCursor && { start_cursor: nextCursor })
            });

            const pages = response.results.filter((item): item is PageObjectResponse => item.object === "page");

            for (const page of pages) {
                const urlProp = this.getPropertyValue(page, "URL");
                if (urlProp?.url) {
                    urls.add(urlProp.url);
                }
            }

            hasMore = response.has_more;
            nextCursor = response.next_cursor ?? null;
        }

        return urls;
    }

    async saveArticle(entry: FeedEntry): Promise<CreatePageResponse> {
        const properties: any = {
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

    private getPropertyValue(page: PageObjectResponse, propertyName: string): any {
        const properties = page.properties as Record<string, any>;
        return properties[propertyName];
    }
}