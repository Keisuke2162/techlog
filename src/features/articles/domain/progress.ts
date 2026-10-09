import type { Article, ArticleStatus } from './types';

export const PROGRESS_STEP = 5;

export function clampProgress(progress: number): number {
  if (!Number.isFinite(progress)) return 0;
  const rounded = Math.round(progress);
  return Math.max(0, Math.min(100, rounded));
}

export function statusForProgress(current: ArticleStatus, progress: number): ArticleStatus {
  if (progress >= 100) return 'done';
  if (progress > 0 && progress < 100) return 'reading';
  // progress === 0
  if (current === 'done') return 'want';
  return current;
}

export interface ApplyProgressResult {
  article: Article;
  changed: boolean;
}

export function applyProgress(
  article: Article,
  nextProgress: number,
  now: string,
): ApplyProgressResult {
  const progress = clampProgress(nextProgress);
  if (progress === article.progress) {
    return { article, changed: false };
  }
  const status = statusForProgress(article.status, progress);
  const finishedAt =
    progress >= 100
      ? (article.finishedAt ?? now)
      : status === 'want' || status === 'reading'
        ? undefined
        : article.finishedAt;
  const next: Article = {
    ...article,
    progress,
    status,
    finishedAt,
    lastReadAt: now,
    updatedAt: now,
  };
  return { article: next, changed: true };
}

export function applyStatus(article: Article, nextStatus: ArticleStatus, now: string): Article {
  if (article.status === nextStatus) return article;
  let progress = article.progress;
  let finishedAt = article.finishedAt;
  let lastReadAt = article.lastReadAt;
  switch (nextStatus) {
    case 'done':
      progress = 100;
      finishedAt = now;
      lastReadAt = now;
      break;
    case 'reading':
      if (progress <= 0 || progress >= 100) {
        progress = Math.max(5, Math.min(95, progress || 5));
      }
      finishedAt = undefined;
      lastReadAt = now;
      break;
    case 'want':
      // progress は保持する（読み直し想定）
      finishedAt = undefined;
      break;
  }
  return {
    ...article,
    status: nextStatus,
    progress,
    finishedAt,
    lastReadAt,
    updatedAt: now,
  };
}

export function markReadTouch(article: Article, now: string): Article {
  return { ...article, lastReadAt: now, updatedAt: now };
}
