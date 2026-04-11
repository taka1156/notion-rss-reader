import { type ChangeEvent, useEffect, useState } from 'react';
import './App.css';

interface NotionDate {
  start: string;
}

interface FeedEntry {
  title: string;
  url: string;
  publishedAt: NotionDate | null;
  updatedAt: NotionDate | null;
  sourceName: string;
  cover: string;
}

export interface JSONOutput {
  categories: string[];
  entries: FeedEntry[];
}

function App() {
  const [entries, setEntries] = useState<FeedEntry[]>([]);
  const [filters, setFilters] = useState<FeedEntry[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch('/entries.json')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json() as Promise<JSONOutput>;
      })
      .then((data) => {
        const { categories, entries } = data;
        setEntries(entries);
        setFilters(entries);
        setCategories(categories);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setErrorMsg(err instanceof Error ? err.message : String(err));
        setLoading(false);
      });
  }, []);

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget.value;
    const freeWord = input.toLowerCase() || '';
    const filteredFreeWord = entries.filter(
      (entry) =>
        entry.title.toLowerCase().includes(freeWord) ||
        entry.sourceName.toLowerCase().includes(freeWord),
    );
    setFilters(filteredFreeWord);
  };

  if (loading) {
    return <p>Loading...</p>;
  }
  if (errorMsg) {
    return <p>Error: {errorMsg}</p>;
  }
  if (!entries.length) {
    return <p>No entries found. Run the CLI to sync feeds.</p>;
  }

  return (
    <main>
      <h1>RSS Feed Entries</h1>

      <div className="container">
        <form className="form" onSubmit={(e) => e.preventDefault()}>
          <label className="form-label" htmlFor="free_word_search">
            Free Word Search
          </label>
          <input
            className="form-input"
            type="search"
            id="free_word_search"
            placeholder="タイトル・ソース名で絞り込む"
            onChange={handleSearch}
            list="categories"
          />
          <datalist id="categories">
            {categories.map((category) => (
              <option key={category} value={category} />
            ))}
          </datalist>
        </form>
      </div>

      <ul className="entries">
        {filters.map((entry) => (
          <li key={entry.url} className="entry">
            {entry.cover && (
              <img src={entry.cover} alt="" className="entry-cover" />
            )}
            <div className="entry-body">
              <a href={entry.url} target="_blank" rel="noreferrer">
                {entry.title}
              </a>
              <span className="entry-meta">
                {entry.sourceName}
                {entry.publishedAt && ` · ${entry.publishedAt.start}`}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}

export default App;
