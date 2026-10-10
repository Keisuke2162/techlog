import type { ArticleStatus } from '@/features/articles/domain/types';

export const STATUS_LABEL: Record<ArticleStatus, string> = {
  want: '未読',
  reading: '読書中',
  done: '読了',
};

export const STATUS_ORDER: ArticleStatus[] = ['want', 'reading', 'done'];
