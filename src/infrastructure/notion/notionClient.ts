import { Client, QueryDataSourceParameters, QueryDataSourceResponse, CreatePageParameters, CreatePageResponse, UpdatePageParameters, UpdatePageResponse } from "@notionhq/client";
import { error, warn } from "../../utils/logger";

export type WithAuth<P> = P & {
    auth?: string;
};

export class NotionClient {
    private client: Client;
    private retryDelay = 1000; // 1秒
    private maxRetries = 3;

    constructor(notionToken: string) {
        this.client = new Client({ auth: notionToken, notionVersion: '2025-09-03' });
    }

    private async withRetry<T>(fn: () => Promise<T>, operation: string): Promise<T> {
        let lastError: Error = new Error("Unknown error");
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                return await fn();
            } catch (err) {
                lastError = err as Error;
                if (this.isRateLimitError(err)) {
                    const delay = this.retryDelay * attempt;
                    warn(`${operation} rate limited, retrying in ${delay}ms (attempt ${attempt}/${this.maxRetries})`);
                    await this.sleep(delay);
                    continue;
                }
                if (attempt === this.maxRetries) {
                    break;
                }
                warn(`${operation} failed, retrying (attempt ${attempt}/${this.maxRetries}):`, err);
                await this.sleep(this.retryDelay);
            }
        }
        error(`${operation} failed after ${this.maxRetries} attempts`, lastError);
        throw lastError;
    }

    private isRateLimitError(err: any): boolean {
        return err?.status === 429 || err?.code === 'rate_limited';
    }

    private async sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async queryDatabase(args: WithAuth<QueryDataSourceParameters>): Promise<QueryDataSourceResponse> {
        return this.withRetry(() => this.client.dataSources.query(args), "queryDatabase");
    }

    async createPage(args: WithAuth<CreatePageParameters>): Promise<CreatePageResponse> {
        return this.withRetry(() => this.client.pages.create(args), "createPage");
    }

    async updatePage(params: WithAuth<UpdatePageParameters>): Promise<UpdatePageResponse> {
        return this.withRetry(() => this.client.pages.update(params), "updatePage");
    }
}