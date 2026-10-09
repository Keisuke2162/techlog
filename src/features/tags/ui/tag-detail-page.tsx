'use client';

import * as React from 'react';
import Link from 'next/link';
import { Download } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { useArticles } from '@/features/articles/ui/hooks';
import { useTag, useTags } from './hooks';
import { STATUS_LABEL } from '@/features/articles/ui/status-label';
import { TagChip } from './tag-chip';
import type { Article, Tag } from '@/features/articles/domain/types';

export function TagDetailPage({ tagId }: { tagId: string }) {
  const tagQuery = useTag(tagId);
  const allTags = useTags();
  const articles = useArticles({ tagIds: [tagId] }, 'addedAt');
  const [exported, setExported] = React.useState<string | null>(null);

  if (tagQuery.isLoading) return <p>読み込み中…</p>;
  if (!tagQuery.data) {
    return (
      <div className="border-border rounded-lg border border-dashed p-8 text-center">
        <p>タグが見つかりませんでした</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/tags">タグ一覧</Link>
        </Button>
      </div>
    );
  }

  const tag = tagQuery.data;
  const list = articles.data ?? [];

  const exportMarkdown = () => {
    const md = buildMarkdown(tag, list, allTags.data ?? []);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sanitize(tag.name)}-matome.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setExported(md);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <TagChip tag={tag} size="md" />
          <h1 className="font-display text-3xl leading-tight tracking-tight sm:text-4xl">
            {tag.name}{' '}
            <span className="text-muted-foreground font-sans text-2xl font-medium">のまとめ</span>
          </h1>
          <span className="text-muted-foreground text-sm">({list.length} 件)</span>
        </div>
        <Button onClick={exportMarkdown} variant="outline">
          <Download className="h-4 w-4" aria-hidden />
          Markdown エクスポート
        </Button>
      </header>

      {list.length === 0 ? (
        <p className="text-muted-foreground text-sm">このタグが付いた記事はありません</p>
      ) : (
        <ul className="space-y-3">
          {list.map((a) => (
            <li key={a.id}>
              <Card>
                <CardHeader className="gap-1">
                  <CardTitle className="text-base">
                    <Link href={`/articles/${a.id}`} className="hover:underline">
                      {a.title}
                    </Link>
                  </CardTitle>
                  <p className="text-muted-foreground text-xs">
                    <a href={a.url} target="_blank" rel="noreferrer" className="hover:underline">
                      {a.url}
                    </a>
                  </p>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="bg-secondary rounded-full px-2 py-0.5">
                      {STATUS_LABEL[a.status]}
                    </span>
                    <span className="font-mono">{a.progress}%</span>
                    {a.finishedAt ? (
                      <span className="text-muted-foreground">
                        読了 {format(parseISO(a.finishedAt), 'yyyy-MM-dd', { locale: ja })}
                      </span>
                    ) : null}
                  </div>
                  {a.memo ? (
                    <pre className="bg-muted rounded p-3 text-sm whitespace-pre-wrap">{a.memo}</pre>
                  ) : null}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {exported ? (
        <p className="sr-only" aria-live="polite">
          Markdown ファイルをダウンロードしました
        </p>
      ) : null}
    </div>
  );
}

function sanitize(name: string): string {
  return name.replace(/[^\w\-ぁ-んァ-ヶ一-龠々ー]+/gu, '_').slice(0, 60);
}

function buildMarkdown(tag: Tag, articles: Article[], allTags: Tag[]): string {
  const lines: string[] = [];
  lines.push(`# ${tag.name} のまとめ`, '');
  lines.push(`${articles.length} 件`, '');
  for (const a of articles) {
    lines.push(`## ${a.title}`);
    lines.push('');
    lines.push(`- URL: ${a.url}`);
    lines.push(`- ステータス: ${STATUS_LABEL[a.status]} (${a.progress}%)`);
    const names = a.tagIds
      .map((id) => allTags.find((t) => t.id === id)?.name)
      .filter((n): n is string => !!n);
    if (names.length) lines.push(`- タグ: ${names.join(', ')}`);
    if (a.finishedAt) {
      lines.push(`- 読了: ${format(parseISO(a.finishedAt), 'yyyy-MM-dd', { locale: ja })}`);
    }
    lines.push('');
    if (a.memo) {
      lines.push(a.memo);
      lines.push('');
    }
  }
  return lines.join('\n');
}
