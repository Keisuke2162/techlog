'use client';

import * as React from 'react';
import Link from 'next/link';
import { parseAsString, parseAsStringEnum, parseAsArrayOf, useQueryStates } from 'nuqs';
import { Search, Plus, Filter } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/shared/ui/card';
import { TagChip } from '@/features/tags/ui/tag-chip';
import { useTags } from '@/features/tags/ui/hooks';
import { useArticles } from './hooks';
import type { Article, ArticleStatus, Tag } from '@/features/articles/domain/types';
import type { ArticleSort } from '@/shared/repository/types';
import { STATUS_LABEL } from './status-label';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

const STATUS_TABS: Array<{ value: ArticleStatus | 'all'; label: string }> = [
  { value: 'all', label: 'すべて' },
  { value: 'want', label: STATUS_LABEL.want },
  { value: 'reading', label: STATUS_LABEL.reading },
  { value: 'done', label: STATUS_LABEL.done },
];

const SORT_OPTIONS: Array<{ value: ArticleSort; label: string }> = [
  { value: 'addedAt', label: '追加日順' },
  { value: 'lastReadAt', label: '最終読書日順' },
  { value: 'progress', label: '進捗順' },
];

const statusParser = parseAsStringEnum<ArticleStatus | 'all'>([
  'all',
  'want',
  'reading',
  'done',
]).withDefault('all');
const sortParser = parseAsStringEnum<ArticleSort>([
  'addedAt',
  'lastReadAt',
  'progress',
]).withDefault('addedAt');
const tagModeParser = parseAsStringEnum<'and' | 'or'>(['and', 'or']).withDefault('and');

export function ArticleList() {
  const tagsQuery = useTags();
  const [filters, setFilters] = useQueryStates({
    status: statusParser,
    q: parseAsString.withDefault(''),
    sort: sortParser,
    tags: parseAsArrayOf(parseAsString).withDefault([]),
    tagMode: tagModeParser,
  });

  const articles = useArticles(
    {
      status: filters.status,
      query: filters.q,
      tagIds: filters.tags,
      tagMode: filters.tagMode,
    },
    filters.sort,
  );

  const totalCount = articles.data?.length ?? 0;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs tracking-widest uppercase">Library</p>
          <h1 className="font-display text-4xl leading-tight tracking-tight sm:text-5xl">
            あなたの<span className="text-gradient-flame italic">書棚</span>
          </h1>
          <p className="text-muted-foreground text-sm">
            {articles.isLoading ? '読み込み中…' : `${totalCount} 本の記事`}
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/articles/new">
            <Plus className="h-4 w-4" aria-hidden /> 新規追加
          </Link>
        </Button>
      </div>

      <div className="border-border/70 bg-card/60 space-y-4 rounded-2xl border p-4 shadow-sm backdrop-blur-sm sm:p-5">
        <Tabs
          value={filters.status}
          onValueChange={(v) => setFilters({ status: v as ArticleStatus | 'all' })}
        >
          <TabsList>
            {STATUS_TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search
              aria-hidden
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
            />
            <Input
              value={filters.q}
              onChange={(e) => setFilters({ q: e.target.value })}
              placeholder="タイトル・URL・メモで検索"
              className="pl-9"
              aria-label="検索"
            />
          </div>
          <Select
            value={filters.sort}
            onValueChange={(v) => setFilters({ sort: v as ArticleSort })}
          >
            <SelectTrigger className="sm:w-48" aria-label="並び順">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <TagFilter
          tags={tagsQuery.data ?? []}
          selected={filters.tags}
          onChange={(ids) => setFilters({ tags: ids })}
          mode={filters.tagMode}
          onModeChange={(m) => setFilters({ tagMode: m })}
        />
      </div>

      {articles.isLoading ? (
        <ListSkeleton />
      ) : articles.isError ? (
        <p className="text-destructive text-sm">記事の取得に失敗しました</p>
      ) : articles.data && articles.data.length > 0 ? (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {articles.data.map((article) => (
            <li key={article.id}>
              <ArticleCard article={article} tags={tagsQuery.data ?? []} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}

function TagFilter({
  tags,
  selected,
  onChange,
  mode,
  onModeChange,
}: {
  tags: Tag[];
  selected: string[];
  onChange: (ids: string[]) => void;
  mode: 'and' | 'or';
  onModeChange: (mode: 'and' | 'or') => void;
}) {
  if (tags.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-muted-foreground inline-flex items-center gap-1 text-sm">
        <Filter aria-hidden className="h-4 w-4" /> タグ:
      </span>
      {tags.map((tag) => {
        const active = selected.includes(tag.id);
        return (
          <button
            key={tag.id}
            type="button"
            onClick={() =>
              onChange(active ? selected.filter((id) => id !== tag.id) : [...selected, tag.id])
            }
            aria-pressed={active}
            className={active ? 'ring-ring rounded-full ring-2' : ''}
          >
            <TagChip tag={tag} />
          </button>
        );
      })}
      {selected.length > 1 ? (
        <div className="border-border ml-auto inline-flex overflow-hidden rounded-md border text-xs">
          <button
            type="button"
            onClick={() => onModeChange('and')}
            className={`px-2 py-1 ${mode === 'and' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-accent'}`}
            aria-pressed={mode === 'and'}
          >
            AND
          </button>
          <button
            type="button"
            onClick={() => onModeChange('or')}
            className={`px-2 py-1 ${mode === 'or' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-accent'}`}
            aria-pressed={mode === 'or'}
          >
            OR
          </button>
        </div>
      ) : null}
      {selected.length > 0 ? (
        <button
          type="button"
          onClick={() => onChange([])}
          className="text-muted-foreground text-xs underline"
        >
          クリア
        </button>
      ) : null}
    </div>
  );
}

const STATUS_STYLE: Record<ArticleStatus, string> = {
  want: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-200',
  reading: 'bg-primary-soft text-accent-foreground',
  done: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200',
};

const PROGRESS_FILL: Record<ArticleStatus, string> = {
  want: 'bg-gradient-sky',
  reading: 'bg-gradient-flame',
  done: 'bg-gradient-leaf',
};

function ArticleCard({ article, tags }: { article: Article; tags: Tag[] }) {
  const articleTags = article.tagIds
    .map((id) => tags.find((t) => t.id === id))
    .filter((t): t is Tag => !!t);
  const host = (() => {
    try {
      return new URL(article.url).host;
    } catch {
      return '';
    }
  })();
  const lastRead = article.lastReadAt
    ? formatDistanceToNow(new Date(article.lastReadAt), { addSuffix: true, locale: ja })
    : null;
  return (
    <Card className="group relative h-full overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md">
      <Link href={`/articles/${article.id}`} className="focus-ring block h-full rounded-xl">
        <CardHeader className="gap-1.5">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLE[article.status]}`}
            >
              {STATUS_LABEL[article.status]}
            </span>
            <span className="text-muted-foreground truncate text-[11px]">
              {article.siteName || host || '—'}
            </span>
          </div>
          <CardTitle className="group-hover:text-primary line-clamp-2 text-base leading-snug transition-colors">
            {article.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">進捗</span>
            <span className="font-mono font-medium tabular-nums">{article.progress}%</span>
          </div>
          <div className="bg-muted relative h-1.5 w-full overflow-hidden rounded-full" aria-hidden>
            <div
              className={`h-full rounded-full transition-all duration-500 ${PROGRESS_FILL[article.status]}`}
              style={{ width: `${article.progress}%` }}
            />
          </div>
          {articleTags.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {articleTags.map((t) => (
                <TagChip key={t.id} tag={t} />
              ))}
            </div>
          ) : null}
        </CardContent>
        <CardFooter className="text-muted-foreground text-xs">
          {lastRead ? `最終読書 ${lastRead}` : '未読'}
        </CardFooter>
      </Link>
    </Card>
  );
}

function ListSkeleton() {
  return (
    <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3" aria-busy>
      {Array.from({ length: 6 }).map((_, i) => (
        <li key={i} className="border-border/70 bg-card h-44 animate-pulse rounded-xl border" />
      ))}
    </ul>
  );
}

function EmptyState() {
  return (
    <div className="border-border bg-card/60 relative overflow-hidden rounded-2xl border border-dashed py-16 text-center backdrop-blur-sm">
      <div className="bg-grid-soft pointer-events-none absolute inset-0 opacity-30" aria-hidden />
      <div className="relative flex flex-col items-center gap-4">
        <span className="bg-primary-soft text-primary inline-flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm">
          <Plus className="h-6 w-6" aria-hidden />
        </span>
        <div className="space-y-1">
          <p className="font-display text-2xl tracking-tight">書棚は、まだ空っぽ。</p>
          <p className="text-muted-foreground text-sm">
            気になる記事をひとつ追加して始めましょう。
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/articles/new">
            <Plus className="h-4 w-4" aria-hidden /> 最初の記事を追加
          </Link>
        </Button>
      </div>
    </div>
  );
}
