import type { Article, ArticleStatus, ReadingLog } from '../domain/types';
import { ArticleSchema, ReadingLogSchema } from '../domain/types';
import { applyProgress, applyStatus, clampProgress, markReadTouch } from '../domain/progress';
import { normalizeUrl } from '@/shared/lib/normalize-url';
import { newId } from '@/shared/lib/id';
import { nowIso, todayDateString } from '@/shared/lib/date';
import type { RepositoryBundle } from '@/shared/repository/types';

export interface AddArticleInput {
  url: string;
  title: string;
  siteName?: string;
  memo?: string;
  tagIds?: string[];
  status?: ArticleStatus;
  progress?: number;
}

export class DuplicateUrlError extends Error {
  constructor(public existing: Article) {
    super('A record with this URL already exists');
    this.name = 'DuplicateUrlError';
  }
}

export async function addArticle(
  repo: RepositoryBundle,
  input: AddArticleInput,
  now: Date = new Date(),
): Promise<Article> {
  const normalized = normalizeUrl(input.url);
  const existing = await repo.articles.findByUrl(normalized);
  if (existing) throw new DuplicateUrlError(existing);

  const ts = nowIso(now);
  const progress = clampProgress(input.progress ?? 0);
  const requestedStatus = input.status ?? 'want';
  const status: ArticleStatus =
    progress >= 100
      ? 'done'
      : progress > 0
        ? 'reading'
        : requestedStatus === 'done'
          ? 'want'
          : requestedStatus;
  const finishedAt = status === 'done' ? ts : undefined;

  const draft: Article = {
    id: newId(),
    url: normalized,
    title: input.title.trim(),
    siteName: input.siteName?.trim() || undefined,
    status,
    progress: status === 'done' ? 100 : progress,
    memo: input.memo ?? '',
    tagIds: input.tagIds ?? [],
    addedAt: ts,
    finishedAt,
    lastReadAt: progress > 0 ? ts : undefined,
    updatedAt: ts,
  };

  const parsed = ArticleSchema.parse(draft);
  return repo.articles.create(parsed);
}

export interface UpdateArticleInput {
  id: string;
  url?: string;
  title?: string;
  siteName?: string;
  memo?: string;
  tagIds?: string[];
  status?: ArticleStatus;
}

export async function updateArticle(
  repo: RepositoryBundle,
  input: UpdateArticleInput,
  now: Date = new Date(),
): Promise<Article> {
  const current = await repo.articles.getById(input.id);
  if (!current) throw new Error(`Article ${input.id} not found`);
  const ts = nowIso(now);
  let next: Article = { ...current, updatedAt: ts };
  if (input.url !== undefined) {
    const normalized = normalizeUrl(input.url);
    if (normalized !== current.url) {
      const dup = await repo.articles.findByUrl(normalized);
      if (dup && dup.id !== current.id) throw new DuplicateUrlError(dup);
      next.url = normalized;
    }
  }
  if (input.title !== undefined) next.title = input.title.trim();
  if (input.siteName !== undefined) next.siteName = input.siteName.trim() || undefined;
  if (input.memo !== undefined) next.memo = input.memo;
  if (input.tagIds !== undefined) next.tagIds = input.tagIds;
  if (input.status && input.status !== current.status) {
    next = applyStatus(next, input.status, ts);
  }
  const parsed = ArticleSchema.parse(next);
  return repo.articles.update(current.id, parsed);
}

export async function deleteArticle(repo: RepositoryBundle, id: string): Promise<void> {
  await repo.readingLogs.deleteByArticle(id);
  await repo.articles.delete(id);
}

export interface UpdateProgressInput {
  articleId: string;
  progress: number;
}

export interface UpdateProgressResult {
  article: Article;
  log: ReadingLog | null;
}

export async function updateProgress(
  repo: RepositoryBundle,
  input: UpdateProgressInput,
  now: Date = new Date(),
): Promise<UpdateProgressResult> {
  const current = await repo.articles.getById(input.articleId);
  if (!current) throw new Error(`Article ${input.articleId} not found`);
  const ts = nowIso(now);
  const result = applyProgress(current, input.progress, ts);
  if (!result.changed) {
    return { article: current, log: null };
  }
  const updated = await repo.articles.update(current.id, result.article);
  const log: ReadingLog = ReadingLogSchema.parse({
    id: newId(),
    articleId: current.id,
    readOn: todayDateString(now),
    progressFrom: current.progress,
    progressTo: updated.progress,
    createdAt: ts,
  });
  await repo.readingLogs.create(log);
  return { article: updated, log };
}

export interface MarkReadTodayInput {
  articleId: string;
  readOn?: string;
}

export async function markReadToday(
  repo: RepositoryBundle,
  input: MarkReadTodayInput,
  now: Date = new Date(),
): Promise<UpdateProgressResult> {
  const current = await repo.articles.getById(input.articleId);
  if (!current) throw new Error(`Article ${input.articleId} not found`);
  const ts = nowIso(now);
  const readOn = input.readOn ?? todayDateString(now);
  const touched = markReadTouch(current, ts);
  const updated = await repo.articles.update(current.id, touched);
  const log: ReadingLog = ReadingLogSchema.parse({
    id: newId(),
    articleId: current.id,
    readOn,
    progressFrom: current.progress,
    progressTo: current.progress,
    createdAt: ts,
  });
  await repo.readingLogs.create(log);
  return { article: updated, log };
}

export async function updateReadingLogDate(
  repo: RepositoryBundle,
  logId: string,
  newReadOn: string,
): Promise<ReadingLog> {
  const all = await repo.readingLogs.all();
  const target = all.find((l) => l.id === logId);
  if (!target) throw new Error(`ReadingLog ${logId} not found`);
  const parsed = ReadingLogSchema.parse({ ...target, readOn: newReadOn });
  return repo.readingLogs.update(logId, parsed);
}

export async function deleteReadingLog(repo: RepositoryBundle, logId: string): Promise<void> {
  await repo.readingLogs.delete(logId);
}
