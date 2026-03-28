import { Client } from "@notionhq/client";
import {
    CreatePageParameters,
    UpdatePageParameters,
    UpdatePageResponse,
    CreatePageResponse,
} from '@notionhq/client/build/src/api-endpoints';

type WithAuth<P> = P & {
    auth?: string;
};

export class NotionClient {
    client: Client;

    constructor(notionToken: string) {
        const notion = new Client({ auth: notionToken });
        this.client = notion;
    }

    async createPage(args: WithAuth<CreatePageParameters>): Promise<CreatePageResponse> {
        try {
            return this.client.pages.create(args);
        } catch (error) {
            console.error("Error creating page:", error);
            throw error;
        }
    }

    async updatePage(params: WithAuth<UpdatePageParameters>): Promise<UpdatePageResponse> {
        try {
            return this.client.pages.update(params);
        } catch (error) {
            console.error("Error updating page:", error);
            throw error;
        }

    }
}