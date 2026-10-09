'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ExternalLink, Trash2, CheckCircle2, Save } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Slider } from '@/shared/ui/slider';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import { Label } from '@/shared/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import {
  useArticle,
  useDeleteArticle,
  useLogsForArticle,
  useMarkReadToday,
  useUpdateArticle,
  useUpdateProgress,
} from './hooks';
import { useRepository } from '@/shared/repository/context';
import { useQueryClient } from '@tanstack/react-query';
import { updateReadingLogDate, deleteReadingLog } from '@/features/articles/application/usecases';
import { QK } from './hooks';
import { TagInput } from '@/features/tags/ui/tag-input';
import { useTags } from '@/features/tags/ui/hooks';
import { STATUS_LABEL, STATUS_ORDER } from './status-label';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useDebouncedCallback } from '@/shared/hooks/use-debounced';
import type { Article, ArticleStatus, Tag } from '@/features/articles/domain/types';

export function ArticleDetail({ articleId }: { articleId: string }) {
  const router = useRouter();
  const articleQuery = useArticle(articleId);
  const tagsQuery = useTags();
  const updateProgress = useUpdateProgress(articleId);
  const markRead = useMarkReadToday();
  const update = useUpdateArticle();
  const del = useDeleteArticle();
  const [showDelete, setShowDelete] = React.useState(false);

  if (articleQuery.isLoading) return <DetailSkeleton />;
  if (!articleQuery.data) {
    return (
      <div className="border-border rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground text-sm">記事が見つかりませんでした</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/articles">一覧へ戻る</Link>
        </Button>
      </div>
    );
  }
  const article = articleQuery.data;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h1 className="text-2xl font-bold tracking-tight">{article.title}</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href={article.url} target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4" aria-hidden /> 開く
              </a>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive"
              onClick={() => setShowDelete(true)}
            >
              <Trash2 className="h-4 w-4" aria-hidden /> 削除
            </Button>
          </div>
        </div>
        <p className="text-muted-foreground truncate text-sm">
          <a href={article.url} target="_blank" rel="noreferrer" className="hover:underline">
            {article.url}
          </a>
        </p>
      </header>

      <ProgressPanel
        article={article}
        onProgress={(v) => updateProgress.mutate(v)}
        onStatus={(s) => update.mutate({ id: article.id, status: s })}
        onMarkRead={() => markRead.mutate(article.id)}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <MetaPanel
          article={article}
          tags={tagsQuery.data ?? []}
          onUpdate={(patch) => update.mutate({ id: article.id, ...patch })}
        />
        <LogsPanel articleId={article.id} />
      </div>

      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>記事を削除</DialogTitle>
            <DialogDescription>
              この記事と、関連する読書ログもすべて削除します。この操作は取り消せません。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDelete(false)}>
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                await del.mutateAsync(article.id);
                toast.success('記事を削除しました');
                router.push('/articles');
              }}
            >
              削除する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProgressPanel({
  article,
  onProgress,
  onStatus,
  onMarkRead,
}: {
  article: Article;
  onProgress: (value: number) => void;
  onStatus: (status: ArticleStatus) => void;
  onMarkRead: () => void;
}) {
  const [localProgress, setLocalProgress] = React.useState(article.progress);
  const [syncedProgress, setSyncedProgress] = React.useState(article.progress);
  if (syncedProgress !== article.progress) {
    setSyncedProgress(article.progress);
    setLocalProgress(article.progress);
  }

  const commit = (value: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(value)));
    setLocalProgress(clamped);
    onProgress(clamped);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">進捗</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Slider
            value={[localProgress]}
            onValueChange={(v) => setLocalProgress(v[0] ?? 0)}
            onValueCommit={(v) => commit(v[0] ?? 0)}
            min={0}
            max={100}
            step={5}
            aria-label="進捗"
            className="flex-1"
          />
          <Input
            type="number"
            min={0}
            max={100}
            step={1}
            value={localProgress}
            onChange={(e) => setLocalProgress(Number(e.target.value) || 0)}
            onBlur={() => commit(localProgress)}
            aria-label="進捗 (%)"
            className="w-20 text-center"
          />
          <span className="text-muted-foreground text-sm">%</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={article.status} onValueChange={(v) => onStatus(v as ArticleStatus)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_ORDER.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={onMarkRead}>
            <CheckCircle2 className="h-4 w-4" aria-hidden /> 今日読んだ
          </Button>
          {article.finishedAt ? (
            <span className="text-muted-foreground text-xs">
              読了: {format(new Date(article.finishedAt), 'yyyy-MM-dd', { locale: ja })}
            </span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function MetaPanel({
  article,
  tags,
  onUpdate,
}: {
  article: Article;
  tags: Tag[];
  onUpdate: (patch: Partial<Article>) => void;
}) {
  const [title, setTitle] = React.useState(article.title);
  const [memo, setMemo] = React.useState(article.memo);
  const [tagIds, setTagIds] = React.useState<string[]>(article.tagIds);
  const [syncedUpdatedAt, setSyncedUpdatedAt] = React.useState(article.updatedAt);
  if (syncedUpdatedAt !== article.updatedAt) {
    setSyncedUpdatedAt(article.updatedAt);
    setTitle(article.title);
    setMemo(article.memo);
    setTagIds(article.tagIds);
  }

  const debouncedMemo = useDebouncedCallback((v: string) => onUpdate({ memo: v }), 600);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">詳細</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="title">タイトル</Label>
          <div className="flex gap-2">
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Button
              variant="outline"
              size="icon"
              onClick={() => onUpdate({ title })}
              aria-label="タイトルを保存"
              disabled={title === article.title || !title.trim()}
            >
              <Save className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <TagInput
          label="タグ"
          allTags={tags}
          value={tagIds}
          onChange={(v) => {
            setTagIds(v);
            onUpdate({ tagIds: v });
          }}
        />
        <div className="space-y-1.5">
          <Label htmlFor="memo">メモ (Markdown)</Label>
          <Textarea
            id="memo"
            rows={8}
            value={memo}
            onChange={(e) => {
              setMemo(e.target.value);
              debouncedMemo(e.target.value);
            }}
          />
          <p className="text-muted-foreground text-xs">自動保存されます</p>
        </div>
      </CardContent>
    </Card>
  );
}

function LogsPanel({ articleId }: { articleId: string }) {
  const logsQuery = useLogsForArticle(articleId);
  const repo = useRepository();
  const qc = useQueryClient();

  async function editDate(logId: string, newDate: string) {
    await updateReadingLogDate(repo, logId, newDate);
    toast.success('ログの日付を更新しました');
    qc.invalidateQueries({ queryKey: QK.logsByArticle(articleId) });
    qc.invalidateQueries({ queryKey: QK.allLogs() });
  }
  async function removeLog(logId: string) {
    await deleteReadingLog(repo, logId);
    toast.success('ログを削除しました');
    qc.invalidateQueries({ queryKey: QK.logsByArticle(articleId) });
    qc.invalidateQueries({ queryKey: QK.allLogs() });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">読書ログ</CardTitle>
      </CardHeader>
      <CardContent>
        {logsQuery.isLoading ? (
          <p className="text-muted-foreground text-sm">読み込み中…</p>
        ) : logsQuery.data && logsQuery.data.length > 0 ? (
          <ul className="space-y-2 text-sm">
            {[...logsQuery.data]
              .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
              .map((log) => (
                <li
                  key={log.id}
                  className="border-border flex items-center justify-between gap-2 rounded-md border p-2"
                >
                  <div className="flex items-center gap-2">
                    <Input
                      type="date"
                      value={log.readOn}
                      onChange={(e) => editDate(log.id, e.target.value)}
                      className="w-40"
                      aria-label="読んだ日"
                    />
                    <span className="text-muted-foreground font-mono text-xs">
                      {log.progressFrom === log.progressTo
                        ? '継続'
                        : `${log.progressFrom}% → ${log.progressTo}%`}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="ログを削除"
                    onClick={() => removeLog(log.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">まだログがありません</p>
        )}
      </CardContent>
    </Card>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-4" aria-busy>
      <div className="bg-muted h-8 w-2/3 animate-pulse rounded" />
      <div className="bg-muted h-32 animate-pulse rounded" />
      <div className="bg-muted h-64 animate-pulse rounded" />
    </div>
  );
}
