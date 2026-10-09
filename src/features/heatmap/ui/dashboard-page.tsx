'use client';

import * as React from 'react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Plus } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Heatmap } from './heatmap';
import { useAllLogs, useArticles, useLogsByDate } from '@/features/articles/ui/hooks';
import { buildCalendarGrid } from '../domain/aggregate';
import { TagChip } from '@/features/tags/ui/tag-chip';
import { useTags } from '@/features/tags/ui/hooks';
import type { Article, Tag } from '@/features/articles/domain/types';

export function DashboardPage() {
  const logs = useAllLogs();
  const reading = useArticles({ status: 'reading' }, 'lastReadAt');
  const recent = useArticles({ status: 'all' }, 'addedAt');
  const tags = useTags();
  const [selectedDate, setSelectedDate] = React.useState<string | null>(null);
  const yearly = React.useMemo(() => buildCalendarGrid(logs.data ?? []), [logs.data]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold tracking-tight">ホーム</h1>
        <Button asChild size="sm">
          <Link href="/articles/new">
            <Plus className="h-4 w-4" aria-hidden /> 記事を追加
          </Link>
        </Button>
      </header>

      <Card>
        <CardHeader className="flex flex-row items-baseline justify-between gap-4">
          <CardTitle className="text-sm font-medium">読書ヒートマップ</CardTitle>
          <p className="text-muted-foreground font-mono text-xs tabular-nums">
            {yearly.activeDays} / 365 日
          </p>
        </CardHeader>
        <CardContent>
          <Heatmap
            logs={logs.data ?? []}
            onCellClick={(cell) => {
              setSelectedDate(cell.points > 0 ? cell.date : null);
            }}
          />
          {selectedDate ? <DayDetails date={selectedDate} tags={tags.data ?? []} /> : null}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ArticleListPreview
          title="読んでる途中"
          href="/articles?status=reading"
          articles={(reading.data ?? []).slice(0, 5)}
          tags={tags.data ?? []}
          emptyText="読んでいる記事はありません"
        />
        <ArticleListPreview
          title="最近追加"
          href="/articles"
          articles={(recent.data ?? []).slice(0, 5)}
          tags={tags.data ?? []}
          emptyText="まだ記事がありません"
        />
      </div>
    </div>
  );
}

function DayDetails({ date, tags }: { date: string; tags: Tag[] }) {
  const logsQuery = useLogsByDate(date);
  const articles = useArticles();
  const articleMap = React.useMemo(() => {
    const m = new Map<string, Article>();
    (articles.data ?? []).forEach((a) => m.set(a.id, a));
    return m;
  }, [articles.data]);
  if (logsQuery.isLoading) return <p className="text-muted-foreground mt-4 text-sm">読み込み中…</p>;
  if (!logsQuery.data || logsQuery.data.length === 0) {
    return <p className="text-muted-foreground mt-4 text-sm">この日のログはありません</p>;
  }
  return (
    <div className="border-border mt-5 space-y-2 border-t pt-4">
      <h3 className="text-sm font-medium">
        {format(parseISO(date), 'yyyy年M月d日 (EEE)', { locale: ja })}
      </h3>
      <ul className="space-y-1">
        {logsQuery.data.map((log) => {
          const article = articleMap.get(log.articleId);
          const articleTags = (article?.tagIds ?? [])
            .map((id) => tags.find((t) => t.id === id))
            .filter((t): t is Tag => !!t);
          return (
            <li
              key={log.id}
              className="border-border/70 flex items-center justify-between gap-2 rounded-md border p-2 text-sm"
            >
              <div className="min-w-0 flex-1">
                {article ? (
                  <Link
                    href={`/articles/${article.id}`}
                    className="hover:text-primary line-clamp-1"
                  >
                    {article.title}
                  </Link>
                ) : (
                  <span className="text-muted-foreground">(削除された記事)</span>
                )}
                {articleTags.length > 0 ? (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {articleTags.map((t) => (
                      <TagChip key={t.id} tag={t} />
                    ))}
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ArticleListPreview({
  title,
  href,
  articles,
  tags,
  emptyText,
}: {
  title: string;
  href: string;
  articles: Article[];
  tags: Tag[];
  emptyText: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Link href={href} className="text-muted-foreground hover:text-foreground text-xs">
          すべて見る
        </Link>
      </CardHeader>
      <CardContent>
        {articles.length === 0 ? (
          <p className="text-muted-foreground text-sm">{emptyText}</p>
        ) : (
          <ul className="divide-border/60 -mx-1 divide-y">
            {articles.map((a) => {
              const articleTags = a.tagIds
                .map((id) => tags.find((t) => t.id === id))
                .filter((t): t is Tag => !!t);
              return (
                <li key={a.id}>
                  <Link
                    href={`/articles/${a.id}`}
                    className="hover:bg-accent/40 block rounded-md px-1 py-2"
                  >
                    <p className="line-clamp-1 text-sm">{a.title}</p>
                    {articleTags.length > 0 ? (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {articleTags.slice(0, 3).map((t) => (
                          <TagChip key={t.id} tag={t} />
                        ))}
                      </div>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
