import { ArticleDetail } from '@/features/articles/ui/article-detail';

export default async function ArticleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ArticleDetail articleId={id} />;
}
