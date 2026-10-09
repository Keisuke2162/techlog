'use client';

import * as React from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Pencil, Trash2, Merge, Check, X as XIcon, Plus } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Card, CardContent } from '@/shared/ui/card';
import { TAG_COLORS, type Tag, type TagColor } from '@/features/articles/domain/types';
import { TAG_COLOR_CLASS, TagChip } from './tag-chip';
import { useCreateTag, useDeleteTag, useMergeTags, useTags, useUpdateTag } from './hooks';
import { useArticles } from '@/features/articles/ui/hooks';
import { DuplicateTagNameError } from '../application/usecases';

export function TagsPage() {
  const tags = useTags();
  const articles = useArticles();
  const [newName, setNewName] = React.useState('');
  const [newColor, setNewColor] = React.useState<TagColor>('slate');
  const createTag = useCreateTag();
  const [editId, setEditId] = React.useState<string | null>(null);
  const [editName, setEditName] = React.useState('');
  const [editColor, setEditColor] = React.useState<TagColor>('slate');
  const updateTag = useUpdateTag();
  const deleteTag = useDeleteTag();
  const mergeTags = useMergeTags();
  const [deleteTarget, setDeleteTarget] = React.useState<Tag | null>(null);
  const [mergeFrom, setMergeFrom] = React.useState<Tag | null>(null);
  const [mergeInto, setMergeInto] = React.useState<string>('');

  const tagUsageCount = React.useMemo(() => {
    const map = new Map<string, number>();
    (articles.data ?? []).forEach((a) => {
      for (const id of a.tagIds) map.set(id, (map.get(id) ?? 0) + 1);
    });
    return map;
  }, [articles.data]);

  const startEdit = (tag: Tag) => {
    setEditId(tag.id);
    setEditName(tag.name);
    setEditColor(tag.color);
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditName('');
  };

  const commitEdit = async (tag: Tag) => {
    if (!editName.trim()) return;
    try {
      await updateTag.mutateAsync({ id: tag.id, name: editName, color: editColor });
      toast.success('タグを更新しました');
      cancelEdit();
    } catch (err) {
      if (err instanceof DuplicateTagNameError) toast.error('同名のタグが既にあります');
      else toast.error(err instanceof Error ? err.message : '更新に失敗しました');
    }
  };

  const addTag = async () => {
    if (!newName.trim()) return;
    try {
      await createTag.mutateAsync({ name: newName, color: newColor });
      setNewName('');
      setNewColor('slate');
      toast.success('タグを作成しました');
    } catch (err) {
      if (err instanceof DuplicateTagNameError) toast.error('同名のタグが既にあります');
      else toast.error(err instanceof Error ? err.message : '作成に失敗しました');
    }
  };

  const totalTags = tags.data?.length ?? 0;
  return (
    <div className="space-y-6">
      <div className="flex items-baseline gap-3">
        <h1 className="text-xl font-semibold tracking-tight">タグ</h1>
        <span className="text-muted-foreground font-mono text-xs tabular-nums">{totalTags}</span>
      </div>

      <Card>
        <CardContent className="space-y-3 pt-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="new-tag-name">タグ名</Label>
              <Input
                id="new-tag-name"
                placeholder="例: Rust"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addTag();
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-tag-color">色</Label>
              <ColorPicker id="new-tag-color" value={newColor} onChange={setNewColor} />
            </div>
            <Button onClick={addTag} disabled={!newName.trim() || createTag.isPending}>
              <Plus className="h-4 w-4" aria-hidden />
              追加
            </Button>
          </div>
        </CardContent>
      </Card>

      {tags.data && tags.data.length > 0 ? (
        <ul className="space-y-2">
          {tags.data.map((tag) => (
            <li
              key={tag.id}
              className="border-border/70 bg-card flex flex-wrap items-center justify-between gap-2 rounded-md border p-3"
            >
              {editId === tag.id ? (
                <div className="flex flex-1 flex-wrap items-center gap-2">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    aria-label="タグ名"
                    className="w-48"
                  />
                  <ColorPicker value={editColor} onChange={setEditColor} />
                  <Button
                    size="sm"
                    onClick={() => commitEdit(tag)}
                    disabled={!editName.trim()}
                    aria-label="保存"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={cancelEdit} aria-label="キャンセル">
                    <XIcon className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <TagChip tag={tag} size="md" />
                    <span className="text-muted-foreground text-xs">
                      {tagUsageCount.get(tag.id) ?? 0} 件
                    </span>
                    <Link href={`/tags/${tag.id}`} className="text-primary text-xs underline">
                      まとめを見る
                    </Link>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => startEdit(tag)}
                      aria-label="編集"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="統合"
                      onClick={() => {
                        setMergeFrom(tag);
                        setMergeInto('');
                      }}
                    >
                      <Merge className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => setDeleteTarget(tag)}
                      aria-label="削除"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground text-sm">まだタグがありません。</p>
      )}

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>タグを削除</DialogTitle>
            <DialogDescription>
              タグ「{deleteTarget?.name}」を削除します。このタグが付いている
              {deleteTarget ? (tagUsageCount.get(deleteTarget.id) ?? 0) : 0}{' '}
              件の記事からタグが外れます。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!deleteTarget) return;
                await deleteTag.mutateAsync(deleteTarget.id);
                toast.success('タグを削除しました');
                setDeleteTarget(null);
              }}
            >
              削除する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!mergeFrom}
        onOpenChange={(open) => {
          if (!open) setMergeFrom(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>タグを統合</DialogTitle>
            <DialogDescription>
              「{mergeFrom?.name}」を他のタグに統合します。元のタグは削除されます。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="merge-into">統合先</Label>
            <Select value={mergeInto} onValueChange={setMergeInto}>
              <SelectTrigger id="merge-into">
                <SelectValue placeholder="選択" />
              </SelectTrigger>
              <SelectContent>
                {(tags.data ?? [])
                  .filter((t) => t.id !== mergeFrom?.id)
                  .map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setMergeFrom(null)}>
              キャンセル
            </Button>
            <Button
              disabled={!mergeInto}
              onClick={async () => {
                if (!mergeFrom || !mergeInto) return;
                await mergeTags.mutateAsync({ fromId: mergeFrom.id, intoId: mergeInto });
                toast.success('タグを統合しました');
                setMergeFrom(null);
              }}
            >
              統合する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ColorPicker({
  id,
  value,
  onChange,
}: {
  id?: string;
  value: TagColor;
  onChange: (c: TagColor) => void;
}) {
  return (
    <div
      id={id}
      className="flex flex-wrap items-center gap-1"
      role="radiogroup"
      aria-label="タグの色"
    >
      {TAG_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          role="radio"
          aria-checked={value === color}
          aria-label={color}
          onClick={() => onChange(color)}
          className={`h-6 w-6 rounded-full ${TAG_COLOR_CLASS[color]} ${
            value === color ? 'ring-ring ring-offset-background ring-2 ring-offset-2' : ''
          }`}
        />
      ))}
    </div>
  );
}
