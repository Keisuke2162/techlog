'use client';

import * as React from 'react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Flame, BookOpen, Plus } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Heatmap } from './heatmap';
import { useAllLogs, useArticles, useLogsByDate } from '@/features/articles/ui/hooks';
import { calcStreak, buildCalendarGrid } from '../domain/aggregate';
import { TagChip } from '@/features/tags/ui/tag-chip';
import { useTags } from '@/features/tags/ui/hooks';
import type { Article, Tag } from '@/features/articles/domain/types';

export function DashboardPage() {
  const logs = useAllLogs();
  const reading = useArticles({ status: 'reading' }, 'lastReadAt');
  const recent = useArticles({ status: 'all' }, 'addedAt');
  const tags = useTags();
  const [selectedDate, setSelectedDate] = React.useState<string | null>(null);
  const streak = React.useMemo(() => calcStreak(logs.data ?? []), [logs.data]);
  const yearly = React.useMemo(() => buildCalendarGrid(logs.data ?? []), [logs.data]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold tracking-tight">ダッシュボード</h1>
        <Button asChild>
          <Link href="/articles/new">
            <Plus className="h-4 w-4" aria-hidden /> 記事を追加
          </Link>
        </Button>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={<Flame className="h-5 w-5" aria-hidden />}
          label="現在のストリーク"
          value={`${streak.current} 日`}
          sub={`最長 ${streak.longest} 日`}
        />
        <StatCard
          icon={<BookOpen className="h-5 w-5" aria-hidden />}
          label="合計読書量"
          value={`${yearly.totalPoints} pt`}
          sub={`アクティブ日 ${yearly.activeDays} 日`}
        />
        <StatCard
          icon={<BookOpen className="h-5 w-5" aria-hidden />}
          label="読んだ記事"
          value={`${recent.data?.filter((a) => a.status === 'done').length ?? 0}`}
          sub={`登録 ${recent.data?.length ?? 0} 件`}
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">読書ヒートマップ</CardTitle>
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
          articles={(reading.data ?? []).slice(0, 5)}
          tags={tags.data ?? []}
          emptyText="読んでいる記事はありません"
        />
        <ArticleListPreview
          title="最近追加"
          articles={(recent.data ?? []).slice(0, 5)}
          tags={tags.data ?? []}
          emptyText="まだ記事がありません"
        />
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between pt-6">
        <div>
          <p className="text-muted-foreground text-sm">{label}</p>
          <p className="text-2xl font-semibold">{value}</p>
          {sub ? <p className="text-muted-foreground text-xs">{sub}</p> : null}
        </div>
        <div className="text-muted-foreground">{icon}</div>
      </CardContent>
    </Card>
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
    <div className="border-border mt-4 space-y-2 border-t pt-4">
      <h3 className="text-sm font-semibold">
        {format(parseISO(date), 'yyyy年M月d日 (EEE)', { locale: ja })}
      </h3>
      <ul className="space-y-1 text-sm">
        {logsQuery.data.map((log) => {
          const article = articleMap.get(log.articleId);
          const articleTags = (article?.tagIds ?? [])
            .map((id) => tags.find((t) => t.id === id))
            .filter((t): t is Tag => !!t);
          return (
            <li
              key={log.id}
              className="border-border flex items-center justify-between gap-2 rounded border p-2"
            >
              <div className="min-w-0 flex-1">
                {article ? (
                  <Link href={`/articles/${article.id}`} className="font-medium hover:underline">
                    {article.title}
                  </Link>
                ) : (
                  <span className="text-muted-foreground">(削除された記事)</span>
                )}
                <div className="mt-0.5 flex flex-wrap gap-1">
                  {articleTags.map((t) => (
                    <TagChip key={t.id} tag={t} />
                  ))}
                </div>
              </div>
              <span className="text-muted-foreground font-mono text-xs">
                {log.progressFrom === log.progressTo
                  ? '継続'
                  : `${log.progressFrom}%→${log.progressTo}%`}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ArticleListPreview({
  title,
  articles,
  tags,
  emptyText,
}: {
  title: string;
  articles: Article[];
  tags: Tag[];
  emptyText: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {articles.length === 0 ? (
          <p className="text-muted-foreground text-sm">{emptyText}</p>
        ) : (
          <ul className="space-y-2">
            {articles.map((a) => {
              const articleTags = a.tagIds
                .map((id) => tags.find((t) => t.id === id))
                .filter((t): t is Tag => !!t);
              return (
                <li key={a.id} className="border-border rounded-md border p-2">
                  <Link href={`/articles/${a.id}`} className="hover:bg-accent/40 block">
                    <p className="line-clamp-1 font-medium">{a.title}</p>
                    <div className="text-muted-foreground mt-1 flex items-center justify-between text-xs">
                      <span>{a.progress}%</span>
                      <div className="flex flex-wrap gap-1">
                        {articleTags.slice(0, 3).map((t) => (
                          <TagChip key={t.id} tag={t} />
                        ))}
                      </div>
                    </div>
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
