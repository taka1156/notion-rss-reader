
import { BaseNotionRepository } from "./BaseNotionRepository";
import { NotionDataSourceIds } from "../../types/notion";
import { NotionClientType, QueryBuilderType } from "../../types/interface";
import { QueryOptions } from "../../types/query";

export class FeederRepository extends BaseNotionRepository {

    constructor(nc: NotionClientType, qb: QueryBuilderType<NotionDataSourceIds>) {
        super({ nc, qb });
    }

    getFeeder(queryOptions: QueryOptions = {}) {
        const query = this.qb.createQuery('FEEDER', queryOptions);
        return this.nc.queryDatabase(query);
    }
}

