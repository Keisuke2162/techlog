import type { Article, ArticleStatus, ReadingLog, Tag } from '@/features/articles/domain/types';

export type ArticleFilter = {
  status?: ArticleStatus | 'all';
  query?: string;
  tagIds?: string[];
  tagMode?: 'and' | 'or';
};

export type ArticleSort = 'addedAt' | 'lastReadAt' | 'progress';

export interface ArticleRepository {
  list(filter?: ArticleFilter, sort?: ArticleSort): Promise<Article[]>;
  getById(id: string): Promise<Article | undefined>;
  findByUrl(normalizedUrl: string): Promise<Article | undefined>;
  create(article: Article): Promise<Article>;
  update(id: string, patch: Partial<Article>): Promise<Article>;
  delete(id: string): Promise<void>;
  count(): Promise<number>;
  bulkPut(articles: Article[]): Promise<void>;
  all(): Promise<Article[]>;
}

export interface TagRepository {
  list(): Promise<Tag[]>;
  getById(id: string): Promise<Tag | undefined>;
  findByName(name: string): Promise<Tag | undefined>;
  create(tag: Tag): Promise<Tag>;
  update(id: string, patch: Partial<Tag>): Promise<Tag>;
  delete(id: string): Promise<void>;
  bulkPut(tags: Tag[]): Promise<void>;
}

export interface ReadingLogRepository {
  listByArticle(articleId: string): Promise<ReadingLog[]>;
  listInRange(fromDate: string, toDate: string): Promise<ReadingLog[]>;
  listByDate(readOn: string): Promise<ReadingLog[]>;
  create(log: ReadingLog): Promise<ReadingLog>;
  update(id: string, patch: Partial<ReadingLog>): Promise<ReadingLog>;
  delete(id: string): Promise<void>;
  deleteByArticle(articleId: string): Promise<void>;
  all(): Promise<ReadingLog[]>;
  bulkPut(logs: ReadingLog[]): Promise<void>;
}

export interface RepositoryBundle {
  articles: ArticleRepository;
  tags: TagRepository;
  readingLogs: ReadingLogRepository;
  clearAll(): Promise<void>;
}
