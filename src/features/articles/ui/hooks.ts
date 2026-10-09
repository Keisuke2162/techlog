'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRepository } from '@/shared/repository/context';
import type { Article, ReadingLog } from '@/features/articles/domain/types';
import type { ArticleFilter, ArticleSort, RepositoryBundle } from '@/shared/repository/types';
import {
  addArticle,
  deleteArticle,
  markReadToday,
  updateArticle,
  updateProgress,
  type AddArticleInput,
  type UpdateArticleInput,
} from '@/features/articles/application/usecases';

export const QK = {
  articles: (filter?: ArticleFilter, sort?: ArticleSort) =>
    ['articles', filter ?? {}, sort ?? 'addedAt'] as const,
  article: (id: string) => ['article', id] as const,
  logsByArticle: (id: string) => ['logs', 'article', id] as const,
  allLogs: () => ['logs', 'all'] as const,
  logsByDate: (date: string) => ['logs', 'date', date] as const,
  count: () => ['articles', 'count'] as const,
};

export function useArticles(filter?: ArticleFilter, sort?: ArticleSort) {
  const repo = useRepository();
  return useQuery({
    queryKey: QK.articles(filter, sort),
    queryFn: () => repo.articles.list(filter, sort),
  });
}

export function useArticle(id: string | undefined) {
  const repo = useRepository();
  return useQuery({
    queryKey: QK.article(id ?? '__none__'),
    queryFn: () => (id ? repo.articles.getById(id) : Promise.resolve(undefined)),
    enabled: !!id,
  });
}

export function useLogsForArticle(id: string | undefined) {
  const repo = useRepository();
  return useQuery({
    queryKey: QK.logsByArticle(id ?? '__none__'),
    queryFn: () => (id ? repo.readingLogs.listByArticle(id) : Promise.resolve<ReadingLog[]>([])),
    enabled: !!id,
  });
}

export function useAllLogs() {
  const repo = useRepository();
  return useQuery({
    queryKey: QK.allLogs(),
    queryFn: () => repo.readingLogs.all(),
  });
}

export function useLogsByDate(date: string | undefined) {
  const repo = useRepository();
  return useQuery({
    queryKey: QK.logsByDate(date ?? ''),
    queryFn: () => (date ? repo.readingLogs.listByDate(date) : Promise.resolve<ReadingLog[]>([])),
    enabled: !!date,
  });
}

function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['articles'] });
  qc.invalidateQueries({ queryKey: ['logs'] });
}

export function useAddArticle() {
  const repo = useRepository();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AddArticleInput) => addArticle(repo, input),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useUpdateArticle() {
  const repo = useRepository();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateArticleInput) => updateArticle(repo, input),
    onSuccess: (article) => {
      qc.setQueryData<Article>(QK.article(article.id), article);
      invalidateAll(qc);
    },
  });
}

export function useDeleteArticle() {
  const repo = useRepository();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteArticle(repo, id),
    onSuccess: () => invalidateAll(qc),
  });
}

export interface OptimisticProgressContext {
  previous: Article | undefined;
}

export function useUpdateProgress(articleId: string) {
  const repo = useRepository();
  const qc = useQueryClient();
  return useMutation<
    Awaited<ReturnType<typeof updateProgress>>,
    Error,
    number,
    OptimisticProgressContext
  >({
    mutationFn: (progress) => updateProgress(repo, { articleId, progress }),
    onMutate: async (progress) => {
      await qc.cancelQueries({ queryKey: QK.article(articleId) });
      const previous = qc.getQueryData<Article>(QK.article(articleId));
      if (previous) {
        qc.setQueryData<Article>(QK.article(articleId), { ...previous, progress });
      }
      return { previous };
    },
    onError: (_err, _progress, context) => {
      if (context?.previous) qc.setQueryData(QK.article(articleId), context.previous);
    },
    onSettled: () => {
      invalidateAll(qc);
    },
  });
}

export function useMarkReadToday() {
  const repo = useRepository();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (articleId: string) => markReadToday(repo, { articleId }),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useRepoBundle(): RepositoryBundle {
  return useRepository();
}
