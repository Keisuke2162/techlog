import { ArticleAddForm } from '@/features/articles/ui/article-form';

export default function NewArticlePage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">記事を追加</h1>
      <ArticleAddForm />
    </div>
  );
}
