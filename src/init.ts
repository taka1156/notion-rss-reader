import { FeederRepository } from "./repositories/notion/FeederRepository";
import { ReaderRepository } from "./repositories/notion/ReaderRepository";
import { FeedParserRepository } from "./repositories/xml/FeedParserRepository";
import { NotionClient } from "./infrastructures/NotionClient";
import { QueryBuilder } from "./infrastructures/QueryBuilder";
import { ProcessFeedsUsecase } from "./usecases/ProcessFeedsUsecase";
import { NotionDataSourceIds } from "./types/notion";
import { XMLParserClient } from "./infrastructures/XMLParserClient";

export type AppRepositories = {
    feedRepository: FeederRepository;
    readerRepository: ReaderRepository;
    feedParserRepository: FeedParserRepository;
};

export function init(NOTION_TOKEN: string, NOTION_DS_IDS: NotionDataSourceIds) {

    // 必要な環境変数が揃っているか確認
    if (!NOTION_TOKEN || !NOTION_DS_IDS.FEEDER || !NOTION_DS_IDS.READER) {
        throw new Error(
            "Please set NOTION_TOKEN and a valid feed/reader DS ID in environment variables."
        );
    }

    // NotionClientを初期化
    const nc = new NotionClient(NOTION_TOKEN);
    const qb = new QueryBuilder<NotionDataSourceIds>(NOTION_DS_IDS);
    const xmlc = new XMLParserClient();

    // リポジトリを初期化
    const repositories = {
        feedRepository: new FeederRepository(nc, qb),
        readerRepository: new ReaderRepository(nc, qb),
        feedParserRepository: new FeedParserRepository(xmlc),
    }

    // ユースケースを初期化
    const processor = new ProcessFeedsUsecase(repositories);

    return processor;
};