'use client';

import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { ArticleAddForm } from '@/features/articles/ui/article-form';

export default function NewArticleModalPage() {
  const router = useRouter();
  return (
    <Dialog
      defaultOpen
      onOpenChange={(open) => {
        if (!open) router.back();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>記事を追加</DialogTitle>
        </DialogHeader>
        <ArticleAddForm onDone={() => router.back()} />
      </DialogContent>
    </Dialog>
  );
}
