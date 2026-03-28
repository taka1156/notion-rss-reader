import 'dotenv/config'
import { setLogLevel, info } from "./utils/logger";
import { init } from './init';
import { NotionDataSourceIds } from './types/notion';

async function main() {
  info("Starting feed processor...");

  // ログレベルの判定と設定
  const debugMode = process.argv.includes("--debug") || process.env.DEBUG === "true";
  setLogLevel(debugMode ? "debug" : "info");

  // 環境変数の読み込みと検証
  const NOTION_TOKEN = process.env.NOTION_TOKEN;
  const NOTION_DS_IDS: NotionDataSourceIds = {
    FEEDER: process.env.NOTION_FEEDER_DATASOURCE_ID || "",
    READER: process.env.NOTION_READER_DATASOURCE_ID || ""
  };

  const processor = init(NOTION_TOKEN!, NOTION_DS_IDS);

  await processor.execute();

  info("Feed processing completed.");
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});
