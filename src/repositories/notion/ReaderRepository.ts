import { QueryBuilder, } from "../../infrastructures/QueryBuilder";
import { FeedEntry } from "../../types/entity";
import { NotionClient } from "../../infrastructures/NotionClient";
import { BaseNotionRepository } from "./BaseNotionRepository";
import { NotionDataSourceIds } from "../../types/notion";
import { PageQueryOptions, QueryOptions } from "../../types/query";

export class ReaderRepository extends BaseNotionRepository {

    constructor(nc: NotionClient, qb: QueryBuilder<NotionDataSourceIds>) {
        super({ nc, qb });
    }

    getReader(queryOptions: QueryOptions = {}) {
        const query = this.qb.createQuery('READER', queryOptions);
        return this.nc.queryDatabase(query);
    }

    saveReader(entry: FeedEntry) {
        const pageOptions: PageQueryOptions = {
            properties: {
                title: { title: [{ text: { content: entry.title } }] },
                URL: { url: entry.url },
                createdAt: { date: entry.publishedAt },
                updatedAt: { date: entry.updatedAt },
                source: { rich_text: [{ text: { content: entry.sourceName } }] },
            }
        };

        const pageQuery = this.qb.createPageQuery('READER', pageOptions);
        return this.nc.createPage(pageQuery);
    }
}

