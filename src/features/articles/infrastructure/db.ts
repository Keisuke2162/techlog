import Dexie, { type Table } from 'dexie';
import type { Article, ReadingLog, Tag } from '../domain/types';

export class TechLogDexie extends Dexie {
  articles!: Table<Article, string>;
  tags!: Table<Tag, string>;
  readingLogs!: Table<ReadingLog, string>;

  constructor(name = 'techlog-db') {
    super(name);
    this.version(1).stores({
      articles: 'id, url, status, addedAt, lastReadAt, updatedAt',
      tags: 'id, name, createdAt',
      readingLogs: 'id, articleId, readOn, [articleId+readOn], createdAt',
    });
  }
}

let singleton: TechLogDexie | null = null;
export function getDb(): TechLogDexie {
  if (!singleton) singleton = new TechLogDexie();
  return singleton;
}

export function resetDbForTest(): void {
  if (singleton) singleton.close();
  singleton = null;
}
