// ------ Notion API response types ------
export type NotionTextProperty = {
    plain_text: string;
};

export type NotionPropertyValue = {
    title?: NotionTextProperty[];
    rich_text?: NotionTextProperty[];
    url?: string;
};

export interface NotionPageProperties {
    [key: string]: NotionPropertyValue;
}

export interface NotionFeedPageResult {
    properties: NotionPageProperties;
}

export interface NotionReaderPageResult {
    id: string;
}

export interface NotionDatabaseQueryResult {
    results: NotionFeedPageResult[];
    has_more: boolean;
    next_cursor?: string | null;
}

export interface NotionReaderQueryResult {
    results: NotionReaderPageResult[];
}

export interface NotionPageResult {
    properties: Record<string, NotionPropertyValue>;
}

export interface NotionDatabaseQueryResponse {
    results: NotionPageResult[];
    has_more: boolean;
    next_cursor?: string | null;
}
