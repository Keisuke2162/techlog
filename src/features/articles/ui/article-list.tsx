'use client';

import * as React from 'react';
import Link from 'next/link';
import { parseAsString, parseAsStringEnum, parseAsArrayOf, useQueryStates } from 'nuqs';
import { Search, Plus, Filter, Pencil, ExternalLink, ChevronDown } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { TagChip } from '@/features/tags/ui/tag-chip';
import { useTags } from '@/features/tags/ui/hooks';
import { useArticles, useUpdateArticle } from './hooks';
import type { Article, ArticleStatus, Tag } from '@/features/articles/domain/types';
import type { ArticleSort } from '@/shared/repository/types';
import { STATUS_LABEL, STATUS_ORDER } from './status-label';
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
        <ul className="flex flex-col gap-2">
          {articles.data.map((article) => (
            <li key={article.id}>
              <ArticleRow article={article} tags={tagsQuery.data ?? []} />
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

function ArticleRow({ article, tags }: { article: Article; tags: Tag[] }) {
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

  const update = useUpdateArticle();
  const onChangeStatus = (next: ArticleStatus) => {
    if (next === article.status) return;
    update.mutate({ id: article.id, status: next });
  };

  return (
    <div className="border-border/70 bg-card hover:border-primary/40 flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors sm:gap-4 sm:px-4 sm:py-3">
      <StatusMenu value={article.status} onChange={onChangeStatus} />
      <a
        href={article.url}
        target="_blank"
        rel="noreferrer"
        className="focus-visible:ring-ring hover:text-primary group/link min-w-0 flex-1 rounded-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        <p className="flex items-center gap-1.5 text-sm font-medium">
          <span className="truncate">{article.title}</span>
          <ExternalLink
            aria-hidden
            className="text-muted-foreground h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover/link:opacity-100"
          />
        </p>
        <p className="text-muted-foreground mt-0.5 truncate text-xs">
          {article.siteName || host || '—'}
        </p>
      </a>
      {articleTags.length > 0 ? (
        <div className="hidden shrink-0 flex-wrap gap-1 md:flex">
          {articleTags.slice(0, 3).map((t) => (
            <TagChip key={t.id} tag={t} />
          ))}
          {articleTags.length > 3 ? (
            <span className="text-muted-foreground text-xs">+{articleTags.length - 3}</span>
          ) : null}
        </div>
      ) : null}
      <span className="text-muted-foreground hidden w-28 shrink-0 text-right text-xs sm:inline">
        {lastRead ?? '未読'}
      </span>
      <Link
        href={`/articles/${article.id}`}
        aria-label={`${article.title} を編集`}
        className="focus-visible:ring-ring text-muted-foreground hover:text-foreground hover:bg-accent inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        <Pencil className="h-4 w-4" aria-hidden />
      </Link>
    </div>
  );
}

function StatusMenu({
  value,
  onChange,
}: {
  value: ArticleStatus;
  onChange: (next: ArticleStatus) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`ステータス: ${STATUS_LABEL[value]}`}
          className={`focus-visible:ring-ring inline-flex shrink-0 items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] transition-colors focus-visible:ring-2 focus-visible:outline-none ${STATUS_STYLE[value]}`}
        >
          {STATUS_LABEL[value]}
          <ChevronDown className="h-3 w-3 opacity-60" aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-28">
        {STATUS_ORDER.map((s) => (
          <DropdownMenuItem
            key={s}
            onSelect={() => onChange(s)}
            className={s === value ? 'bg-accent/60' : ''}
          >
            {STATUS_LABEL[s]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ListSkeleton() {
  return (
    <ul className="flex flex-col gap-2" aria-busy>
      {Array.from({ length: 8 }).map((_, i) => (
        <li key={i} className="border-border bg-muted/30 h-14 animate-pulse rounded-lg border" />
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
