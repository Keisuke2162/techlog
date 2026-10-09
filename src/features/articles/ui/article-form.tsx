'use client';

import * as React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import { Label } from '@/shared/ui/label';
import { TagInput } from '@/features/tags/ui/tag-input';
import { useTags } from '@/features/tags/ui/hooks';
import { useAddArticle, useArticles } from './hooks';
import { DuplicateUrlError } from '@/features/articles/application/usecases';
import { useRouter } from 'next/navigation';
import { normalizeUrl } from '@/shared/lib/normalize-url';
import Link from 'next/link';

const FormSchema = z.object({
  url: z.string().min(1, 'URL は必須です').url('URL の形式が正しくありません'),
  title: z.string().min(1, 'タイトルは必須です'),
  siteName: z.string().optional(),
  memo: z.string().optional(),
  tagIds: z.array(z.string()),
});
type FormValues = z.infer<typeof FormSchema>;

export function ArticleAddForm({ onDone }: { onDone?: () => void }) {
  const router = useRouter();
  const tagsQuery = useTags();
  const add = useAddArticle();
  const articles = useArticles();
  const [duplicateId, setDuplicateId] = React.useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: { url: '', title: '', siteName: '', memo: '', tagIds: [] },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setDuplicateId(null);
    try {
      const article = await add.mutateAsync({
        url: values.url,
        title: values.title,
        siteName: values.siteName,
        memo: values.memo,
        tagIds: values.tagIds,
      });
      toast.success('記事を追加しました');
      if (onDone) onDone();
      else router.push(`/articles/${article.id}`);
    } catch (err) {
      if (err instanceof DuplicateUrlError) {
        setDuplicateId(err.existing.id);
        toast.error('同じ URL の記事が既に存在します');
        return;
      }
      toast.error(err instanceof Error ? err.message : '追加に失敗しました');
    }
  });

  const url = useWatch({ control: form.control, name: 'url' });
  const tagIds = useWatch({ control: form.control, name: 'tagIds' });
  const normalizedUrl = React.useMemo(() => (url ? normalizeUrl(url) : ''), [url]);
  const duplicateFromList = React.useMemo(
    () =>
      normalizedUrl && articles.data
        ? (articles.data.find((a) => a.url === normalizedUrl) ?? null)
        : null,
    [normalizedUrl, articles.data],
  );
  const inlineDuplicateId = duplicateId ?? duplicateFromList?.id ?? null;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="url">URL</Label>
        <Input id="url" placeholder="https://..." {...form.register('url')} autoFocus />
        {form.formState.errors.url ? (
          <p className="text-destructive text-sm">{form.formState.errors.url.message}</p>
        ) : null}
        {inlineDuplicateId ? (
          <p className="text-sm text-amber-600 dark:text-amber-400">
            既に同じ URL の記事が登録されています。
            <Link
              className="ml-1 underline"
              href={`/articles/${inlineDuplicateId}`}
              onClick={onDone}
            >
              その記事を開く
            </Link>
          </p>
        ) : null}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="title">タイトル</Label>
        <Input id="title" {...form.register('title')} />
        {form.formState.errors.title ? (
          <p className="text-destructive text-sm">{form.formState.errors.title.message}</p>
        ) : null}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="siteName">サイト名 (任意)</Label>
        <Input id="siteName" {...form.register('siteName')} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="memo">メモ (Markdown)</Label>
        <Textarea id="memo" rows={4} {...form.register('memo')} />
      </div>
      <TagInput
        label="タグ"
        allTags={tagsQuery.data ?? []}
        value={tagIds ?? []}
        onChange={(next) => form.setValue('tagIds', next)}
      />
      <div className="flex justify-end gap-2">
        {onDone ? (
          <Button type="button" variant="ghost" onClick={onDone}>
            キャンセル
          </Button>
        ) : null}
        <Button type="submit" disabled={form.formState.isSubmitting || add.isPending}>
          追加
        </Button>
      </div>
    </form>
  );
}
