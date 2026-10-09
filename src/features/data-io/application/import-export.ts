import type { RepositoryBundle } from '@/shared/repository/types';
import {
  ExportBundleSchema,
  SCHEMA_VERSION,
  type Article,
  type ExportBundle,
  type Tag,
} from '@/features/articles/domain/types';
import { nowIso } from '@/shared/lib/date';

export async function exportAll(
  repo: RepositoryBundle,
  now: Date = new Date(),
): Promise<ExportBundle> {
  const [articles, tags, readingLogs] = await Promise.all([
    repo.articles.all(),
    repo.tags.list(),
    repo.readingLogs.all(),
  ]);
  return {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: nowIso(now),
    articles,
    tags,
    readingLogs,
  };
}

export type ImportMode = 'merge' | 'replace';

export interface ImportResult {
  articles: { added: number; updated: number; skipped: number };
  tags: { added: number; updated: number; skipped: number };
  readingLogs: { added: number; updated: number; skipped: number };
}

export class InvalidImportError extends Error {
  constructor(public issues: string[]) {
    super(`Invalid import data: ${issues.join('; ')}`);
    this.name = 'InvalidImportError';
  }
}

export function parseImportJson(input: unknown): ExportBundle {
  const result = ExportBundleSchema.safeParse(input);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
    throw new InvalidImportError(issues);
  }
  return result.data;
}

export async function importAll(
  repo: RepositoryBundle,
  bundle: ExportBundle,
  mode: ImportMode,
): Promise<ImportResult> {
  if (mode === 'replace') {
    await repo.clearAll();
    await repo.tags.bulkPut(bundle.tags);
    await repo.articles.bulkPut(bundle.articles);
    await repo.readingLogs.bulkPut(bundle.readingLogs);
    return {
      articles: { added: bundle.articles.length, updated: 0, skipped: 0 },
      tags: { added: bundle.tags.length, updated: 0, skipped: 0 },
      readingLogs: { added: bundle.readingLogs.length, updated: 0, skipped: 0 },
    };
  }

  const [existingArticles, existingTags, existingLogs] = await Promise.all([
    repo.articles.all(),
    repo.tags.list(),
    repo.readingLogs.all(),
  ]);

  // tags: by name case-insensitively
  const tagByName = new Map<string, Tag>();
  for (const t of existingTags) tagByName.set(t.name.trim().toLocaleLowerCase(), t);
  const tagRename = new Map<string, string>(); // incoming id → final id

  let tagsAdded = 0;
  let tagsUpdated = 0;
  const tagsToPut: Tag[] = [];
  for (const incoming of bundle.tags) {
    const key = incoming.name.trim().toLocaleLowerCase();
    const existing = tagByName.get(key);
    if (existing) {
      tagRename.set(incoming.id, existing.id);
      // prefer newer createdAt? Tag has no updatedAt — keep existing.
      tagsUpdated += 1;
    } else {
      tagByName.set(key, incoming);
      tagsToPut.push(incoming);
      tagsAdded += 1;
    }
  }
  if (tagsToPut.length) await repo.tags.bulkPut(tagsToPut);

  // articles: by url
  const articleByUrl = new Map<string, Article>();
  for (const a of existingArticles) articleByUrl.set(a.url, a);
  const articleIdRename = new Map<string, string>();
  const articlesToPut: Article[] = [];
  let articlesAdded = 0;
  let articlesUpdated = 0;
  let articlesSkipped = 0;
  for (const incoming of bundle.articles) {
    const remappedTagIds = incoming.tagIds.map((tid) => tagRename.get(tid) ?? tid);
    const normalized: Article = { ...incoming, tagIds: remappedTagIds };
    const existing = articleByUrl.get(normalized.url);
    if (!existing) {
      articleByUrl.set(normalized.url, normalized);
      articlesToPut.push(normalized);
      articlesAdded += 1;
    } else if (normalized.updatedAt > existing.updatedAt) {
      // keep existing id to maintain log linkage
      const merged: Article = { ...normalized, id: existing.id };
      articleIdRename.set(normalized.id, existing.id);
      articleByUrl.set(normalized.url, merged);
      articlesToPut.push(merged);
      articlesUpdated += 1;
    } else {
      articleIdRename.set(normalized.id, existing.id);
      articlesSkipped += 1;
    }
  }
  if (articlesToPut.length) await repo.articles.bulkPut(articlesToPut);

  // reading logs: by id, remap articleId when applicable
  const existingLogIds = new Set(existingLogs.map((l) => l.id));
  const logsToPut = bundle.readingLogs.map((l) => ({
    ...l,
    articleId: articleIdRename.get(l.articleId) ?? l.articleId,
  }));
  const uniqueLogs = logsToPut.filter((l, idx, arr) => arr.findIndex((x) => x.id === l.id) === idx);
  let logsAdded = 0;
  let logsUpdated = 0;
  for (const l of uniqueLogs) {
    if (existingLogIds.has(l.id)) logsUpdated += 1;
    else logsAdded += 1;
  }
  if (uniqueLogs.length) await repo.readingLogs.bulkPut(uniqueLogs);

  return {
    articles: { added: articlesAdded, updated: articlesUpdated, skipped: articlesSkipped },
    tags: { added: tagsAdded, updated: tagsUpdated, skipped: 0 },
    readingLogs: { added: logsAdded, updated: logsUpdated, skipped: 0 },
  };
}
