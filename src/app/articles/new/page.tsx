import { ArticleAddForm } from '@/features/articles/ui/article-form';

export default function NewArticlePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold tracking-tight">記事を追加</h1>
      <ArticleAddForm />
    </div>
  );
}
