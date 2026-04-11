export interface Env {
  NOTION_TOKEN: string;
  NOTION_FEEDER_DATASOURCE_ID: string;
  NOTION_READER_DATASOURCE_ID: string;
}

/**
 * 環境変数を検証し、必要な値がすべて存在することを確認する。
 * 不足している環境変数がある場合はエラーをスローする。
 * @returns Envオブジェクト
 * @throws 環境変数が不足している場合はエラーをスローする
 */
export function validateEnv(): Env {
  const NOTION_TOKEN = process.env.NOTION_TOKEN;
  const NOTION_FEEDER_DATASOURCE_ID = process.env.NOTION_FEEDER_DATASOURCE_ID;
  const NOTION_READER_DATASOURCE_ID = process.env.NOTION_READER_DATASOURCE_ID;

  if (!NOTION_TOKEN) {
    throw new Error('NOTION_TOKEN is required');
  }
  if (!NOTION_FEEDER_DATASOURCE_ID) {
    throw new Error('NOTION_FEEDER_DATASOURCE_ID is required');
  }
  if (!NOTION_READER_DATASOURCE_ID) {
    throw new Error('NOTION_READER_DATASOURCE_ID is required');
  }

  return {
    NOTION_TOKEN,
    NOTION_FEEDER_DATASOURCE_ID,
    NOTION_READER_DATASOURCE_ID,
  };
}
