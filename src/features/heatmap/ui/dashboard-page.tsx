'use client';

import * as React from 'react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Flame, BookOpen, Plus, Sparkles, Hash, ArrowRight } from 'lucide-react';
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
  const doneCount = recent.data?.filter((a) => a.status === 'done').length ?? 0;
  const totalCount = recent.data?.length ?? 0;

  const greeting = getGreeting();
  const todayLabel = format(new Date(), 'yyyy年M月d日 (EEE)', { locale: ja });

  return (
    <div className="space-y-10">
      <HeroHeader greeting={greeting} todayLabel={todayLabel} streak={streak.current} />

      <section
        aria-label="統計サマリ"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <StatCard
          tone="flame"
          icon={<Flame className="h-5 w-5" aria-hidden />}
          label="現在のストリーク"
          value={streak.current}
          unit="日"
          sub={`最長 ${streak.longest} 日`}
        />
        <StatCard
          tone="sky"
          icon={<Sparkles className="h-5 w-5" aria-hidden />}
          label="合計読書量"
          value={yearly.totalPoints}
          unit="pt"
          sub={`アクティブ日 ${yearly.activeDays} 日`}
        />
        <StatCard
          tone="leaf"
          icon={<BookOpen className="h-5 w-5" aria-hidden />}
          label="読み終えた記事"
          value={doneCount}
          unit="本"
          sub={`登録 ${totalCount} 本`}
        />
      </section>

      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="font-display text-2xl">読書ヒートマップ</CardTitle>
            <p className="text-muted-foreground mt-1 text-xs">
              1マス = 1日。濃いほど多く読んでいます。
            </p>
          </div>
          <HeatmapLegendInline />
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
          accent="flame"
        />
        <ArticleListPreview
          title="最近追加"
          href="/articles"
          articles={(recent.data ?? []).slice(0, 5)}
          tags={tags.data ?? []}
          emptyText="まだ記事がありません"
          accent="sky"
        />
      </div>
    </div>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 5) return 'おやすみなさい';
  if (h < 11) return 'おはようございます';
  if (h < 17) return 'こんにちは';
  if (h < 22) return 'こんばんは';
  return 'お疲れさまです';
}

function HeroHeader({
  greeting,
  todayLabel,
  streak,
}: {
  greeting: string;
  todayLabel: string;
  streak: number;
}) {
  return (
    <section className="border-border/70 bg-card/60 relative overflow-hidden rounded-2xl border p-6 shadow-sm backdrop-blur-sm sm:p-8">
      <div className="bg-grid-soft pointer-events-none absolute inset-0 opacity-50" aria-hidden />
      <div
        className="bg-gradient-flame pointer-events-none absolute -top-16 -right-10 h-56 w-56 rounded-full opacity-20 blur-3xl"
        aria-hidden
      />
      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-2">
          <p className="text-muted-foreground inline-flex items-center gap-2 text-xs tracking-widest uppercase">
            <span className="bg-primary h-1.5 w-1.5 rounded-full" />
            {todayLabel}
          </p>
          <h1 className="font-display text-4xl leading-tight tracking-tight sm:text-5xl">
            {greeting}、<span className="text-gradient-flame italic">今日もひとつ</span>
            読もう。
          </h1>
          {streak > 0 ? (
            <p className="text-muted-foreground max-w-xl text-sm">
              <Flame className="text-primary mr-1 inline h-4 w-4" aria-hidden />
              <span className="text-foreground font-medium">{streak}日連続</span>
              で読書を続けています。この調子で。
            </p>
          ) : (
            <p className="text-muted-foreground max-w-xl text-sm">
              今日の1本を記録して、ストリークを始めましょう。
            </p>
          )}
        </div>
        <Button asChild size="lg" className="shrink-0">
          <Link href="/articles/new">
            <Plus className="h-4 w-4" aria-hidden /> 記事を追加
          </Link>
        </Button>
      </div>
    </section>
  );
}

const TONE_STYLES = {
  flame: {
    bar: 'bg-gradient-flame',
    icon: 'text-primary bg-primary-soft',
    text: 'text-gradient-flame',
  },
  sky: {
    bar: 'bg-gradient-sky',
    icon: 'text-sky-700 bg-sky-100 dark:text-sky-200 dark:bg-sky-900/40',
    text: 'text-gradient-sky',
  },
  leaf: {
    bar: 'bg-gradient-leaf',
    icon: 'text-emerald-700 bg-emerald-100 dark:text-emerald-200 dark:bg-emerald-900/40',
    text: 'text-gradient-leaf',
  },
} as const;

function StatCard({
  icon,
  label,
  value,
  unit,
  sub,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  unit?: string;
  sub?: string;
  tone: keyof typeof TONE_STYLES;
}) {
  const styles = TONE_STYLES[tone];
  return (
    <Card className="group relative overflow-hidden hover:-translate-y-0.5 hover:shadow-md">
      <div className={`absolute inset-x-0 top-0 h-1 ${styles.bar}`} aria-hidden />
      <CardContent className="flex items-start justify-between gap-4 pt-6">
        <div className="min-w-0 space-y-1">
          <p className="text-muted-foreground text-xs tracking-wider uppercase">{label}</p>
          <p className="flex items-baseline gap-1">
            <span className={`font-display text-4xl leading-none tracking-tight ${styles.text}`}>
              {value}
            </span>
            {unit ? (
              <span className="text-muted-foreground text-sm font-medium">{unit}</span>
            ) : null}
          </p>
          {sub ? <p className="text-muted-foreground text-xs">{sub}</p> : null}
        </div>
        <div
          className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${styles.icon}`}
          aria-hidden
        >
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

const LEGEND_BG = ['bg-heatmap-0', 'bg-heatmap-1', 'bg-heatmap-2', 'bg-heatmap-3', 'bg-heatmap-4'];

function HeatmapLegendInline() {
  return (
    <div className="text-muted-foreground hidden items-center gap-2 text-[11px] sm:flex">
      <span>少</span>
      {LEGEND_BG.map((cls, l) => (
        <span key={l} className={`h-2.5 w-2.5 rounded-sm ${cls}`} aria-hidden />
      ))}
      <span>多</span>
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
    <div className="border-border bg-muted/30 mt-6 space-y-2 rounded-xl border border-dashed p-4">
      <h3 className="font-display text-lg tracking-tight">
        {format(parseISO(date), 'yyyy年M月d日 (EEE)', { locale: ja })}
      </h3>
      <ul className="space-y-1.5 text-sm">
        {logsQuery.data.map((log) => {
          const article = articleMap.get(log.articleId);
          const articleTags = (article?.tagIds ?? [])
            .map((id) => tags.find((t) => t.id === id))
            .filter((t): t is Tag => !!t);
          return (
            <li
              key={log.id}
              className="border-border/70 bg-background/80 flex items-center justify-between gap-2 rounded-lg border p-2"
            >
              <div className="min-w-0 flex-1">
                {article ? (
                  <Link
                    href={`/articles/${article.id}`}
                    className="hover:text-primary font-medium hover:underline"
                  >
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
  href,
  articles,
  tags,
  emptyText,
  accent,
}: {
  title: string;
  href: string;
  articles: Article[];
  tags: Tag[];
  emptyText: string;
  accent: keyof typeof TONE_STYLES;
}) {
  const styles = TONE_STYLES[accent];
  return (
    <Card className="relative overflow-hidden">
      <div className={`absolute inset-x-0 top-0 h-1 ${styles.bar}`} aria-hidden />
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-display text-xl tracking-tight">{title}</CardTitle>
        <Link
          href={href}
          className="text-muted-foreground hover:text-primary inline-flex items-center gap-1 text-xs"
        >
          すべて見る <ArrowRight className="h-3 w-3" aria-hidden />
        </Link>
      </CardHeader>
      <CardContent>
        {articles.length === 0 ? (
          <div className="text-muted-foreground border-border/70 flex flex-col items-center gap-1 rounded-xl border border-dashed py-8 text-center text-sm">
            <Hash className="h-4 w-4 opacity-60" aria-hidden />
            {emptyText}
          </div>
        ) : (
          <ul className="divide-border/60 divide-y">
            {articles.map((a) => {
              const articleTags = a.tagIds
                .map((id) => tags.find((t) => t.id === id))
                .filter((t): t is Tag => !!t);
              return (
                <li key={a.id} className="py-3 first:pt-0 last:pb-0">
                  <Link
                    href={`/articles/${a.id}`}
                    className="group focus-ring flex items-start gap-3 rounded-md"
                  >
                    <ProgressRing value={a.progress} tone={accent} />
                    <div className="min-w-0 flex-1">
                      <p className="group-hover:text-primary line-clamp-1 font-medium transition-colors">
                        {a.title}
                      </p>
                      <div className="text-muted-foreground mt-1 flex items-center gap-2 text-xs">
                        <span className="font-mono tabular-nums">{a.progress}%</span>
                        {articleTags.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {articleTags.slice(0, 3).map((t) => (
                              <TagChip key={t.id} tag={t} />
                            ))}
                          </div>
                        ) : null}
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

function ProgressRing({ value, tone }: { value: number; tone: keyof typeof TONE_STYLES }) {
  const size = 36;
  const stroke = 3;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, value));
  const dash = (clamped / 100) * c;
  const gradientId = `grad-${tone}`;
  const gradStops =
    tone === 'flame'
      ? ['#ff9a3d', '#f54e2a']
      : tone === 'sky'
        ? ['#38bdf8', '#8b5cf6']
        : ['#34d399', '#06b6d4'];
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden
      className="shrink-0"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={gradStops[0]} />
          <stop offset="1" stopColor={gradStops[1]} />
        </linearGradient>
      </defs>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        strokeWidth={stroke}
        stroke="hsl(var(--muted))"
        fill="none"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        strokeWidth={stroke}
        stroke={`url(#${gradientId})`}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${c - dash}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-foreground font-mono"
        fontSize="10"
      >
        {clamped}
      </text>
    </svg>
  );
}
