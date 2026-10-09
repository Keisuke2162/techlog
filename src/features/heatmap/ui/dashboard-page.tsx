'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Plus, Loader2, ClipboardPaste } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Heatmap } from './heatmap';
import {
  useAddArticle,
  useAllLogs,
  useArticles,
  useLogsByDate,
} from '@/features/articles/ui/hooks';
import { DuplicateUrlError } from '@/features/articles/application/usecases';
import { buildCalendarGrid } from '../domain/aggregate';
import { TagChip } from '@/features/tags/ui/tag-chip';
import { useTags } from '@/features/tags/ui/hooks';
import type { Article, ArticleStatus, ReadingLog, Tag } from '@/features/articles/domain/types';

export function DashboardPage() {
  const logs = useAllLogs();
  const all = useArticles({ status: 'all' }, 'addedAt');
  const tags = useTags();
  const [selectedDate, setSelectedDate] = React.useState<string | null>(null);
  const yearly = React.useMemo(() => buildCalendarGrid(logs.data ?? []), [logs.data]);

  const monthlyRead = React.useMemo(
    () => countUniqueArticlesThisMonth(logs.data ?? []),
    [logs.data],
  );
  const statusCounts = React.useMemo(() => countByStatus(all.data ?? []), [all.data]);

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

      <section aria-label="サマリ" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="今月" value={monthlyRead} unit="本" />
        <Stat label="読んだ" value={statusCounts.done} unit="本" href="/articles?status=done" />
        <Stat
          label="読んでる"
          value={statusCounts.reading}
          unit="本"
          href="/articles?status=reading"
        />
        <Stat label="まだ" value={statusCounts.want} unit="本" href="/articles?status=want" />
      </section>

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

      <QuickAdd />
    </div>
  );
}

function QuickAdd() {
  const [url, setUrl] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const add = useAddArticle();
  const router = useRouter();

  const canSubmit = isHttpUrl(url.trim()) && !submitting;

  const handlePaste = async () => {
    if (!navigator.clipboard?.readText) {
      toast.error('このブラウザではペーストを使えません');
      return;
    }
    try {
      const text = await navigator.clipboard.readText();
      if (!text) {
        toast.error('クリップボードが空です');
        return;
      }
      setUrl(text.trim());
    } catch {
      toast.error('クリップボードを読み取れませんでした');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = url.trim();
    if (!isHttpUrl(value)) {
      toast.error('http(s) で始まる URL を入力してください');
      return;
    }
    setSubmitting(true);
    try {
      const { title, siteName } = await resolveTitle(value);
      const article = await add.mutateAsync({
        url: value,
        title,
        siteName,
        status: 'want',
      });
      setUrl('');
      toast.success('「まだ」に追加しました', {
        action: {
          label: '開く',
          onClick: () => router.push(`/articles/${article.id}`),
        },
      });
    } catch (err) {
      if (err instanceof DuplicateUrlError) {
        const id = err.existing.id;
        toast.error('この URL は既に登録されています', {
          action: {
            label: '開く',
            onClick: () => router.push(`/articles/${id}`),
          },
        });
      } else {
        toast.error(err instanceof Error ? err.message : '追加に失敗しました');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-5">
        <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Input
              type="url"
              inputMode="url"
              placeholder="https://..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              aria-label="追加する記事の URL"
              disabled={submitting}
            />
            {submitting ? (
              <Loader2
                aria-hidden
                className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin"
              />
            ) : null}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handlePaste}
              disabled={submitting}
              aria-label="クリップボードから貼り付け"
            >
              <ClipboardPaste className="h-4 w-4" aria-hidden /> ペースト
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              <Plus className="h-4 w-4" aria-hidden /> 追加
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function isHttpUrl(input: string): boolean {
  try {
    const u = new URL(input);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

async function resolveTitle(url: string): Promise<{ title: string; siteName?: string }> {
  try {
    const res = await fetch(`/api/fetch-title?url=${encodeURIComponent(url)}`);
    if (res.ok) {
      const data = (await res.json()) as { title?: string; siteName?: string };
      if (data.title && data.title.trim()) {
        return { title: data.title.trim(), siteName: data.siteName?.trim() || undefined };
      }
    }
  } catch {
    /* ignore and fall back */
  }
  return { title: fallbackTitleFromUrl(url) };
}

function fallbackTitleFromUrl(url: string): string {
  try {
    const u = new URL(url);
    const path = u.pathname.replace(/\/$/, '');
    return path ? `${u.host}${path}` : u.host;
  } catch {
    return url;
  }
}

function Stat({
  label,
  value,
  unit,
  href,
}: {
  label: string;
  value: number;
  unit?: string;
  href?: string;
}) {
  const body = (
    <>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-1 flex items-baseline gap-1">
        <span className="font-mono text-2xl font-semibold tracking-tight tabular-nums">
          {value}
        </span>
        {unit ? <span className="text-muted-foreground text-xs">{unit}</span> : null}
      </p>
    </>
  );
  if (href) {
    return (
      <Link
        href={href}
        className="hover:border-primary/40 focus-visible:ring-ring border-border/70 bg-card block rounded-lg border p-4 transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        {body}
      </Link>
    );
  }
  return <div className="border-border/70 bg-card rounded-lg border p-4">{body}</div>;
}

function countUniqueArticlesThisMonth(logs: readonly ReadingLog[]): number {
  const now = new Date();
  const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const ids = new Set<string>();
  for (const log of logs) {
    if (log.readOn.startsWith(prefix)) ids.add(log.articleId);
  }
  return ids.size;
}

function countByStatus(articles: readonly Article[]): Record<ArticleStatus, number> {
  const counts: Record<ArticleStatus, number> = { want: 0, reading: 0, done: 0 };
  for (const a of articles) counts[a.status] += 1;
  return counts;
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
