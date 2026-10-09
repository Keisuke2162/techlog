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
];

const statusParser = parseAsStringEnum<ArticleStatus | 'all'>([
  'all',
  'want',
  'reading',
  'done',
]).withDefault('all');
const sortParser = parseAsStringEnum<ArticleSort>(['addedAt', 'lastReadAt']).withDefault('addedAt');
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <h1 className="text-xl font-semibold tracking-tight">記事</h1>
          <span className="text-muted-foreground font-mono text-xs tabular-nums">
            {articles.isLoading ? '…' : totalCount}
          </span>
        </div>
        <Button asChild size="sm">
          <Link href="/articles/new">
            <Plus className="h-4 w-4" aria-hidden /> 新規追加
          </Link>
        </Button>
      </div>

      <div className="space-y-4">
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
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
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
  want: 'text-muted-foreground border-border',
  reading: 'text-accent-foreground border-primary/30 bg-accent/70',
  done: 'text-muted-foreground border-border',
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
    <Card className="hover:border-primary/40 h-full transition-colors">
      <Link
        href={`/articles/${article.id}`}
        className="focus-visible:ring-ring block h-full rounded-lg focus-visible:ring-2 focus-visible:outline-none"
      >
        <CardHeader className="gap-1.5">
          <div className="flex items-center gap-2 text-[11px]">
            <span
              className={`inline-flex items-center rounded border px-1.5 py-0.5 ${STATUS_STYLE[article.status]}`}
            >
              {STATUS_LABEL[article.status]}
            </span>
            <span className="text-muted-foreground truncate">
              {article.siteName || host || '—'}
            </span>
          </div>
          <CardTitle className="line-clamp-2 text-sm leading-snug font-medium">
            {article.title}
          </CardTitle>
        </CardHeader>
        {articleTags.length > 0 ? (
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {articleTags.map((t) => (
                <TagChip key={t.id} tag={t} />
              ))}
            </div>
          </CardContent>
        ) : null}
        <CardFooter className="text-muted-foreground text-xs">
          {lastRead ? `最終読書 ${lastRead}` : '未読'}
        </CardFooter>
      </Link>
    </Card>
  );
}

function ListSkeleton() {
  return (
    <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3" aria-busy>
      {Array.from({ length: 6 }).map((_, i) => (
        <li key={i} className="border-border bg-muted/30 h-28 animate-pulse rounded-lg border" />
      ))}
    </ul>
  );
}

function EmptyState() {
  return (
    <div className="border-border rounded-lg border border-dashed py-12 text-center">
      <p className="text-muted-foreground text-sm">記事がありません</p>
      <Button asChild variant="outline" size="sm" className="mt-4">
        <Link href="/articles/new">
          <Plus className="h-4 w-4" aria-hidden /> 追加
        </Link>
      </Button>
    </div>
  );
}
