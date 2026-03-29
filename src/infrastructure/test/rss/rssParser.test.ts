import { describe, expect, it } from 'vitest';
import { XMLRSSParser } from '../../rss/rssParser';

describe('XMLRSSParser', () => {
  it('should parse RSS XML', () => {
    const parser = new XMLRSSParser();
    const xml = `<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <item>
      <title>Test Article</title>
      <link>https://example.com</link>
      <pubDate>2023-01-01</pubDate>
    </item>
  </channel>
</rss>`;

    const items = parser.parse(xml);
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe('Test Article');
    expect(items[0].link).toBe('https://example.com');
  });
});
