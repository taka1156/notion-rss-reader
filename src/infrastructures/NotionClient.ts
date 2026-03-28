import { Client, QueryDataSourceParameters, QueryDataSourceResponse } from "@notionhq/client";
import {
    CreatePageParameters,
    UpdatePageParameters,
    UpdatePageResponse,
    CreatePageResponse
} from '@notionhq/client';
import { error } from "../utils/logger";

export type WithAuth<P> = P & {
    auth?: string;
};

export class NotionClient {
    client: Client;

    constructor(notionToken: string) {
        const notion = new Client({ auth: notionToken, notionVersion: '2025-09-03' });
        this.client = notion;
    }

    private async withLogging<T>(fn: () => Promise<T>, operation: string): Promise<T> {
        try {
            return await fn();
        } catch (err) {
            error(`NotionClient ${operation} failed`, err);
            throw err;
        }
    }

    async queryDatabase(args: WithAuth<QueryDataSourceParameters>): Promise<QueryDataSourceResponse> {
        return this.withLogging(() => this.client.dataSources.query(args), "queryDatabase");
    }

    async createPage(args: WithAuth<CreatePageParameters>): Promise<CreatePageResponse> {
        return this.withLogging(() => this.client.pages.create(args), "createPage");
    }

    async updatePage(params: WithAuth<UpdatePageParameters>): Promise<UpdatePageResponse> {
        return this.withLogging(() => this.client.pages.update(params), "updatePage");
    }
}