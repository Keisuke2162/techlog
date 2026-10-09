import type { ArticleStatus } from '@/features/articles/domain/types';

export const STATUS_LABEL: Record<ArticleStatus, string> = {
  want: 'まだ',
  reading: '読んでる',
  done: '読んだ',
};

export const STATUS_ORDER: ArticleStatus[] = ['want', 'reading', 'done'];
