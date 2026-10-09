import type {
  ArticleFilter,
  ArticleRepository,
  ArticleSort,
  ReadingLogRepository,
  RepositoryBundle,
  TagRepository,
} from '@/shared/repository/types';
import type { Article, ReadingLog, Tag } from '../domain/types';
import { getDb, type TechLogDexie } from './db';

function matchesQuery(article: Article, q: string): boolean {
  if (!q) return true;
  const needle = q.toLocaleLowerCase();
  return (
    article.title.toLocaleLowerCase().includes(needle) ||
    article.url.toLocaleLowerCase().includes(needle) ||
    article.memo.toLocaleLowerCase().includes(needle)
  );
}

function matchesTags(
  article: Article,
  tagIds: string[] | undefined,
  mode: 'and' | 'or' | undefined,
): boolean {
  if (!tagIds || tagIds.length === 0) return true;
  if (mode === 'or') return tagIds.some((t) => article.tagIds.includes(t));
  return tagIds.every((t) => article.tagIds.includes(t));
}

function compareArticles(a: Article, b: Article, sort: ArticleSort | undefined): number {
  switch (sort) {
    case 'lastReadAt': {
      const av = a.lastReadAt ?? '';
      const bv = b.lastReadAt ?? '';
      return bv.localeCompare(av) || b.addedAt.localeCompare(a.addedAt);
    }
    case 'progress':
      return b.progress - a.progress || b.addedAt.localeCompare(a.addedAt);
    case 'addedAt':
    default:
      return b.addedAt.localeCompare(a.addedAt);
  }
}

class DexieArticleRepository implements ArticleRepository {
  constructor(private db: TechLogDexie) {}

  async list(filter?: ArticleFilter, sort?: ArticleSort): Promise<Article[]> {
    const all = await this.db.articles.toArray();
    const filtered = all.filter((article) => {
      if (filter?.status && filter.status !== 'all' && article.status !== filter.status)
        return false;
      if (!matchesQuery(article, filter?.query ?? '')) return false;
      if (!matchesTags(article, filter?.tagIds, filter?.tagMode)) return false;
      return true;
    });
    filtered.sort((a, b) => compareArticles(a, b, sort));
    return filtered;
  }

  getById(id: string): Promise<Article | undefined> {
    return this.db.articles.get(id);
  }

  async findByUrl(normalizedUrl: string): Promise<Article | undefined> {
    return this.db.articles.where('url').equals(normalizedUrl).first();
  }

  async create(article: Article): Promise<Article> {
    await this.db.articles.add(article);
    return article;
  }

  async update(id: string, patch: Partial<Article>): Promise<Article> {
    await this.db.articles.update(id, patch);
    const updated = await this.db.articles.get(id);
    if (!updated) throw new Error(`Article ${id} not found after update`);
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.db.articles.delete(id);
  }

  count(): Promise<number> {
    return this.db.articles.count();
  }

  async bulkPut(articles: Article[]): Promise<void> {
    await this.db.articles.bulkPut(articles);
  }

  all(): Promise<Article[]> {
    return this.db.articles.toArray();
  }
}

class DexieTagRepository implements TagRepository {
  constructor(private db: TechLogDexie) {}

  list(): Promise<Tag[]> {
    return this.db.tags.orderBy('name').toArray();
  }

  getById(id: string): Promise<Tag | undefined> {
    return this.db.tags.get(id);
  }

  async findByName(name: string): Promise<Tag | undefined> {
    const target = name.trim().toLocaleLowerCase();
    const all = await this.db.tags.toArray();
    return all.find((t) => t.name.trim().toLocaleLowerCase() === target);
  }

  async create(tag: Tag): Promise<Tag> {
    await this.db.tags.add(tag);
    return tag;
  }

  async update(id: string, patch: Partial<Tag>): Promise<Tag> {
    await this.db.tags.update(id, patch);
    const updated = await this.db.tags.get(id);
    if (!updated) throw new Error(`Tag ${id} not found after update`);
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.db.tags.delete(id);
  }

  async bulkPut(tags: Tag[]): Promise<void> {
    await this.db.tags.bulkPut(tags);
  }
}

class DexieReadingLogRepository implements ReadingLogRepository {
  constructor(private db: TechLogDexie) {}

  listByArticle(articleId: string): Promise<ReadingLog[]> {
    return this.db.readingLogs.where('articleId').equals(articleId).sortBy('createdAt');
  }

  listInRange(fromDate: string, toDate: string): Promise<ReadingLog[]> {
    return this.db.readingLogs.where('readOn').between(fromDate, toDate, true, true).toArray();
  }

  listByDate(readOn: string): Promise<ReadingLog[]> {
    return this.db.readingLogs.where('readOn').equals(readOn).toArray();
  }

  async create(log: ReadingLog): Promise<ReadingLog> {
    await this.db.readingLogs.add(log);
    return log;
  }

  async update(id: string, patch: Partial<ReadingLog>): Promise<ReadingLog> {
    await this.db.readingLogs.update(id, patch);
    const updated = await this.db.readingLogs.get(id);
    if (!updated) throw new Error(`ReadingLog ${id} not found after update`);
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.db.readingLogs.delete(id);
  }

  async deleteByArticle(articleId: string): Promise<void> {
    await this.db.readingLogs.where('articleId').equals(articleId).delete();
  }

  all(): Promise<ReadingLog[]> {
    return this.db.readingLogs.toArray();
  }

  async bulkPut(logs: ReadingLog[]): Promise<void> {
    await this.db.readingLogs.bulkPut(logs);
  }
}

export function createDexieRepository(db: TechLogDexie = getDb()): RepositoryBundle {
  return {
    articles: new DexieArticleRepository(db),
    tags: new DexieTagRepository(db),
    readingLogs: new DexieReadingLogRepository(db),
    async clearAll() {
      await db.transaction('rw', db.articles, db.tags, db.readingLogs, async () => {
        await Promise.all([db.articles.clear(), db.tags.clear(), db.readingLogs.clear()]);
      });
    },
  };
}
