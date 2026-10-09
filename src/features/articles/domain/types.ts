import { z } from 'zod';

export const ARTICLE_STATUS = ['want', 'reading', 'done'] as const;
export const ArticleStatusSchema = z.enum(ARTICLE_STATUS);
export type ArticleStatus = z.infer<typeof ArticleStatusSchema>;

export const TAG_COLORS = [
  'slate',
  'red',
  'orange',
  'amber',
  'yellow',
  'lime',
  'green',
  'emerald',
  'teal',
  'cyan',
  'sky',
  'blue',
  'indigo',
  'violet',
  'purple',
  'fuchsia',
  'pink',
  'rose',
] as const;
export const TagColorSchema = z.enum(TAG_COLORS);
export type TagColor = z.infer<typeof TagColorSchema>;

export const ArticleSchema = z.object({
  id: z.string().min(1),
  url: z.string().url(),
  title: z.string().min(1).max(500),
  siteName: z.string().max(200).optional(),
  status: ArticleStatusSchema,
  progress: z.number().int().min(0).max(100),
  memo: z.string().max(50_000).default(''),
  tagIds: z.array(z.string().min(1)).default([]),
  addedAt: z.string().min(1),
  finishedAt: z.string().optional(),
  lastReadAt: z.string().optional(),
  updatedAt: z.string().min(1),
});
export type Article = z.infer<typeof ArticleSchema>;

export const TagSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(60),
  color: TagColorSchema.default('slate'),
  createdAt: z.string().min(1),
});
export type Tag = z.infer<typeof TagSchema>;

export const ReadingLogSchema = z.object({
  id: z.string().min(1),
  articleId: z.string().min(1),
  readOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/u, 'readOn must be YYYY-MM-DD'),
  progressFrom: z.number().int().min(0).max(100),
  progressTo: z.number().int().min(0).max(100),
  createdAt: z.string().min(1),
});
export type ReadingLog = z.infer<typeof ReadingLogSchema>;

export const SCHEMA_VERSION = 1 as const;

export const ExportBundleSchema = z.object({
  schemaVersion: z.literal(1),
  exportedAt: z.string().min(1),
  articles: z.array(ArticleSchema),
  tags: z.array(TagSchema),
  readingLogs: z.array(ReadingLogSchema),
});
export type ExportBundle = z.infer<typeof ExportBundleSchema>;
