import 'dotenv/config';
import { SyncFeedUseCaseImpl } from './application/syncFeedUseCase';
import { validateEnv } from './config/env';
import { NotionClient } from './infrastructure/notion/notionClient';
import { NotionFeedRepository } from './infrastructure/notion/notionFeedRepository';
import { HTTPRSSFetcher } from './infrastructure/rss/rssFetcher';
import { XMLRSSParser } from './infrastructure/rss/rssParser';
import { info, setLogLevel } from './utils/logger';

async function main() {
  info('Starting feed processor...');

  // ログレベルの判定と設定
  const debugMode =
    process.argv.includes('--debug') || process.env.DEBUG === 'true';
  setLogLevel(debugMode ? 'debug' : 'info');

  // 環境変数の検証
  const env = validateEnv();

  // インフラ層の初期化
  const notionClient = new NotionClient(env.NOTION_TOKEN);
  const notionRepo = new NotionFeedRepository(
    notionClient,
    env.NOTION_FEEDER_DATASOURCE_ID,
    env.NOTION_READER_DATASOURCE_ID,
  );
  const rssFetcher = new HTTPRSSFetcher();
  const rssParser = new XMLRSSParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
  });

  // ユースケースの初期化
  const useCase = new SyncFeedUseCaseImpl(notionRepo, rssFetcher, rssParser);

  // 実行
  await useCase.execute();

  info('Feed processing completed.');
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});
