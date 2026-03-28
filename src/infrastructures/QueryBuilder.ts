import { QueryDataSourceParameters, CreatePageParameters } from "@notionhq/client";
import { WithAuth } from "./NotionClient";
import { PageQueryOptions, QueryOptions } from "../types/query";

const PAGE_SIZE = 100;
const DEFAULT_RESULT_TYPE: QueryDataSourceParameters["result_type"] = "page";

/**
 * クエリビルダークラスは、Notionのデータソースに対するクエリを構築するための抽象クラスです。
 * 具体的なクエリの構築は、サブクラスで実装されます。
 * クエリビルダークラスは、データソースIDを保持し、クエリの共通部分を提供します。
 *
 * @abstract
 * @class QueryBuilder
 * @param {string} dataSourceId - クエリを実行するデータソースのID
 */
export class QueryBuilder<T extends Record<string, string>> {
    // DBでいうテーブルにあたるデータソースIDを保持
    private dataSourceIds: T;

    constructor(dataSourceIds: T) {
        this.dataSourceIds = dataSourceIds;
    }

    /**
     * クエリを構築するためのメソッド。サブクラスでオーバーライドして、特定のクエリを構築することができます。
     * @param options - クエリオプション。クエリの条件やオプションを含むオブジェクト。
     * @returns WithAuth<QueryDataSourceParameters> - 認証情報を含むクエリのパラメータオブジェクト
     */
    createQuery(dataSourceId: keyof T, options: QueryOptions = {}): WithAuth<QueryDataSourceParameters> {
        return {
            data_source_id: this.dataSourceIds[dataSourceId],
            page_size: PAGE_SIZE,
            result_type: DEFAULT_RESULT_TYPE,
            ...options,
        };
    }


    /**
     * ページ作成のクエリを構築するためのメソッド。サブクラスでオーバーライドして、特定のページ作成クエリを構築することができます。
     * @param options - クエリオプション。ページ作成に必要なパラメータを含むオブジェクト。
     * @returns WithAuth<CreatePageParameters> - 認証情報を含むページ作成クエリのパラメータオブジェクト
     */
    createPageQuery(dataSourceId: keyof T,options: PageQueryOptions = {}): WithAuth<CreatePageParameters> {
        return {
            parent: { data_source_id: this.dataSourceIds[dataSourceId] },
            ...options,
        };
    }
}

