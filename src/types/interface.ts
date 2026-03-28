import { NotionDataSourceIds } from "./notion";

export type NotionClientType = import("../infrastructures/NotionClient").NotionClient;
export type QueryBuilderType<T extends Record<string, string>> = import("../infrastructures/QueryBuilder").QueryBuilder<T>;
export type XMLParserClientType = import("../infrastructures/XMLParserClient").XMLParserClient;

export interface NotionRepositoriesDependencies {
    nc: NotionClientType;
    qb: QueryBuilderType<NotionDataSourceIds>;
}

export interface XMLRepositoriesDependencies {
    xmlc: XMLParserClientType;
}