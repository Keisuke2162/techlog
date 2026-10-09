import type { ArticleStatus } from '@/features/articles/domain/types';

export const STATUS_LABEL: Record<ArticleStatus, string> = {
  want: '読みたい',
  reading: '途中',
  done: '読んだ',
};

export const STATUS_ORDER: ArticleStatus[] = ['want', 'reading', 'done'];
