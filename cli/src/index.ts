import path from 'node:path';
import dotenv from 'dotenv';
import { SyncFeedUseCaseImpl } from './application/syncFeedUseCase';
import { validateEnv } from './config/env';
import { NotionClient } from './infrastructure/notion/notionClient';
import { NotionFeedRepository } from './infrastructure/notion/notionFeedRepository';
import { HTTPRSSFetcher } from './infrastructure/rss/rssFetcher';
import { XMLRSSParser } from './infrastructure/rss/rssParser';
import { info, setLogLevel } from './utils/logger';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function main() {
  info('Starting feed processor...');

  // ログレベルの判定と設定
  const debugMode =
    process.argv.includes('--debug') || process.env.DEBUG === 'true';
  setLogLevel(debugMode ? 'debug' : 'info');

  // リセットオプションの判定
  const resetMode = process.argv.includes('--reset');

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

  // リセットモードの場合、Reader内の全記事を削除してから同期
  if (resetMode) {
    info('Resetting Reader database...');
    await notionRepo.clearAllArticles();
    info('Reader database reset completed.');
  }

  // 実行
  await useCase.execute();

  info('Feed processing completed.');
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});
