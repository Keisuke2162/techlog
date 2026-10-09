import { ArticleAddForm } from '@/features/articles/ui/article-form';

export default function NewArticlePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-1">
        <p className="text-muted-foreground text-xs tracking-widest uppercase">New entry</p>
        <h1 className="font-display text-4xl leading-tight tracking-tight sm:text-5xl">
          <span className="text-gradient-flame italic">記事</span>を追加
        </h1>
        <p className="text-muted-foreground text-sm">URL を貼るとタイトルを自動で読み取ります。</p>
      </div>
      <div className="border-border/70 bg-card/70 rounded-2xl border p-5 shadow-sm backdrop-blur-sm sm:p-6">
        <ArticleAddForm />
      </div>
    </div>
  );
}
