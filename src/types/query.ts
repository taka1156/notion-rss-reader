import { CreatePageParameters, QueryDataSourceParameters } from "@notionhq/client";

export type QueryOptions = Partial<Omit<QueryDataSourceParameters, "data_source_id">>;
export type PageQueryOptions = Partial<Omit<CreatePageParameters, "parent">>
