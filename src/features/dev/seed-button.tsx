'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Sprout } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { useRepository } from '@/shared/repository/context';
import { useQueryClient } from '@tanstack/react-query';
import { seedDemoData } from './seed';

export function SeedButton() {
  const repo = useRepository();
  const qc = useQueryClient();
  const [loading, setLoading] = React.useState(false);
  const run = async (articles: number) => {
    try {
      setLoading(true);
      const r = await seedDemoData(repo, { articles });
      toast.success(`シードを投入しました (記事 ${r.articles} / タグ ${r.tags} / ログ ${r.logs})`);
      qc.invalidateQueries();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'シードに失敗しました');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="flex gap-2">
      <Button variant="outline" onClick={() => run(30)} disabled={loading}>
        <Sprout className="h-4 w-4" aria-hidden /> デモデータ (30 件)
      </Button>
      <Button variant="outline" onClick={() => run(1000)} disabled={loading}>
        <Sprout className="h-4 w-4" aria-hidden /> 性能確認 (1000 件)
      </Button>
    </div>
  );
}
