import fetch from "cross-fetch";
import { info, warn, error } from "../utils/logger";
import { AtomEntry, FeedConfig, FeedEntry, RssItem } from "../types/entity";
import { CreatePageResponse, PageObjectResponse, QueryDataSourceResponse } from "@notionhq/client";
import { FeederRepository } from "../repositories/notion/FeederRepository";
import { ReaderRepository } from "../repositories/notion/ReaderRepository";
import { FeedParserRepository } from "../repositories/xml/FeedParserRepository";
import { convertFeedItemToEntry } from "../presenters/format";

export type ProcessFeedsDependency = {
  feedRepository: FeederRepository;
  readerRepository: ReaderRepository;
  feedParserRepository: FeedParserRepository;
};

function getPropertyValue(page: PageObjectResponse, propertyName: string): unknown {
  const properties = page.properties as unknown as Record<string, unknown>;
  return properties[propertyName];
}

export class ProcessFeedsUsecase {
  constructor(private readonly repo: ProcessFeedsDependency) {}

  private async getFeedConfigs(): Promise<FeedConfig[]> {
    const feedConfigs: FeedConfig[] = [];
    let hasMore = true;
    let nextCursor: string | null = null;

    while (hasMore) {
      const pageResult = await this.repo.feedRepository.getFeeder({ start_cursor: nextCursor || undefined });
      const results = (pageResult.results ?? []) as QueryDataSourceResponse["results"];

      const pageResults = results.filter((item): item is PageObjectResponse => item.object === "page");

      for (const page of pageResults) {
        const nameProp = getPropertyValue(page, "Name") as any;
        const urlProp = getPropertyValue(page, "URL") as any;

        if (nameProp?.title?.[0]?.plain_text && urlProp?.url) {
          feedConfigs.push({
            name: nameProp.title[0].plain_text,
            url: urlProp.url,
          });
        }
      }

      hasMore = !!pageResult.has_more;
      nextCursor = pageResult.next_cursor ?? null;
    }

    return feedConfigs;
  }

  private async getAllReaderUrls(): Promise<Set<string>> {
    const urls = new Set<string>();
    let hasMore = true;
    let nextCursor: string | null = null;

    while (hasMore) {
      const pageResult = await this.repo.readerRepository.getReader({ start_cursor: nextCursor || undefined });
      const results = (pageResult.results ?? []) as QueryDataSourceResponse["results"];

      const pageResults = results.filter((item): item is PageObjectResponse => item.object === "page");

      for (const page of pageResults) {
        const urlProp = getPropertyValue(page, "URL") as any;
        if (urlProp?.url) {
          urls.add(urlProp.url);
        }
      }

      hasMore = !!pageResult.has_more;
      nextCursor = pageResult.next_cursor ?? null;
    }

    return urls;
  }

  private async createReaderPage(entry: FeedEntry): Promise<CreatePageResponse> {
    return this.repo.readerRepository.saveReader(entry);
  }

  async execute(): Promise<void> {
    info("Fetching feed configs from Notion...");

    const feedConfigs = await this.getFeedConfigs();
    if (!feedConfigs.length) {
      info("No feed configs found in the feed datasource.");
      return;
    }

    const readerUrls = await this.getAllReaderUrls();
    info(`Feed configs: ${feedConfigs.map((f) => `${f.name}: ${f.url}`).join(", ")}`);

    for (const feed of feedConfigs) {
      try {
        info(`Processing ${feed.name} (${feed.url})`);
        const res = await fetch(feed.url);
        if (!res.ok) {
          warn(`Failed to fetch ${feed.url}: ${res.status}`);
          continue;
        }

        const feedText = await res.text();
        const rawItems = this.repo.feedParserRepository.parseFeedXml(feedText);

        const entries = rawItems
          .map((item: AtomEntry | RssItem) => convertFeedItemToEntry(item, feed.name))
          .filter((e): e is FeedEntry => e !== null);

        for (const entry of entries) {
          if (!entry.url) continue;
          if (readerUrls.has(entry.url)) continue;

          await this.createReaderPage(entry);
          readerUrls.add(entry.url);
          info(`Added article: ${entry.title} (${entry.url})`);
        }
      } catch (err) {
        error(`Failed to process ${feed.name}`, err);
      }
    }

    info("Done.");
  }
}
