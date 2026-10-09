'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Download, Upload, Trash2 } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { useRepository } from '@/shared/repository/context';
import { useQueryClient } from '@tanstack/react-query';
import {
  exportAll,
  importAll,
  InvalidImportError,
  parseImportJson,
  type ImportMode,
  type ImportResult,
} from '@/features/data-io/application/import-export';
import { SeedButton } from '@/features/dev/seed-button';
import {
  BACKGROUND_PRESETS,
  useBackground,
  type BackgroundPreset,
} from '@/shared/providers/background-provider';
import { Check } from 'lucide-react';

export function SettingsPage() {
  const repo = useRepository();
  const qc = useQueryClient();
  const [importMode, setImportMode] = React.useState<ImportMode>('merge');
  const [confirmReplace, setConfirmReplace] = React.useState<File | null>(null);
  const [confirmClear, setConfirmClear] = React.useState(false);
  const [result, setResult] = React.useState<ImportResult | null>(null);

  const handleExport = async () => {
    const bundle = await exportAll(repo);
    const blob = new Blob([JSON.stringify(bundle, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `techlog-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('エクスポートしました');
  };

  const runImport = async (file: File, mode: ImportMode) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      const bundle = parseImportJson(parsed);
      const res = await importAll(repo, bundle, mode);
      setResult(res);
      qc.invalidateQueries();
      toast.success('インポートしました');
    } catch (err) {
      if (err instanceof InvalidImportError) {
        toast.error('ファイル形式が不正です');
      } else {
        toast.error(err instanceof Error ? err.message : 'インポートに失敗しました');
      }
    }
  };

  const handleFile = async (file: File) => {
    if (importMode === 'replace') {
      setConfirmReplace(file);
      return;
    }
    await runImport(file, 'merge');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold tracking-tight">設定</h1>

      <BackgroundPicker />

      <Card>
        <CardHeader>
          <CardTitle>エクスポート</CardTitle>
          <CardDescription>
            すべての記事・タグ・読書ログを JSON ファイルとしてダウンロードします。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleExport}>
            <Download className="h-4 w-4" aria-hidden /> JSON をダウンロード
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>インポート</CardTitle>
          <CardDescription>
            エクスポートした JSON を読み込みます。マージ: 既存を保持して追加 / 置換:
            全データを削除後にインポート。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-4" role="radiogroup" aria-label="インポートモード">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="mode"
                value="merge"
                checked={importMode === 'merge'}
                onChange={() => setImportMode('merge')}
              />
              マージ
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="mode"
                value="replace"
                checked={importMode === 'replace'}
                onChange={() => setImportMode('replace')}
              />
              置換
            </label>
          </div>
          <label className="border-input bg-background inline-flex cursor-pointer items-center gap-2 rounded-md border px-4 py-2 text-sm">
            <Upload className="h-4 w-4" aria-hidden />
            JSON ファイルを選択
            <input
              type="file"
              accept="application/json"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleFile(file);
                  e.target.value = '';
                }
              }}
            />
          </label>
          {result ? (
            <pre className="bg-muted rounded p-3 text-xs">{JSON.stringify(result, null, 2)}</pre>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>開発用シード</CardTitle>
          <CardDescription>
            デモ用のデータを投入します。既にデータがある場合はエラーになります。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SeedButton />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">全データ削除</CardTitle>
          <CardDescription>
            ブラウザに保存されているすべてのデータを削除します。この操作は取り消せません。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={() => setConfirmClear(true)}>
            <Trash2 className="h-4 w-4" aria-hidden />
            全データを削除
          </Button>
        </CardContent>
      </Card>

      <Dialog
        open={!!confirmReplace}
        onOpenChange={(open) => {
          if (!open) setConfirmReplace(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>データを置換</DialogTitle>
            <DialogDescription>
              現在のデータをすべて削除してからインポートします。元に戻せません。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmReplace(null)}>
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                const file = confirmReplace;
                setConfirmReplace(null);
                if (file) await runImport(file, 'replace');
              }}
            >
              置換する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmClear} onOpenChange={setConfirmClear}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>全データを削除</DialogTitle>
            <DialogDescription>
              記事・タグ・読書ログをすべて削除します。元に戻せません。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmClear(false)}>
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                await repo.clearAll();
                qc.invalidateQueries();
                setConfirmClear(false);
                toast.success('全データを削除しました');
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

const SWATCH_BG: Record<BackgroundPreset, string> = {
  paper: 'hsl(40 24% 94%)',
  mist: 'hsl(220 18% 96%)',
  stone: 'hsl(30 8% 93%)',
  sand: 'hsl(35 28% 92%)',
  sage: 'hsl(140 12% 93%)',
  snow: 'hsl(0 0% 100%)',
};

function BackgroundPicker() {
  const { background, setBackground: apply } = useBackground();
  return (
    <Card>
      <CardHeader>
        <CardTitle>背景色</CardTitle>
        <CardDescription>
          ライトモードの背景プリセットを選択します。選択はこのブラウザに保存されます。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          role="radiogroup"
          aria-label="背景色プリセット"
          className="grid grid-cols-2 gap-2 sm:grid-cols-3"
        >
          {BACKGROUND_PRESETS.map((p) => {
            const selected = background === p.value;
            return (
              <button
                key={p.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => apply(p.value)}
                className={`focus-visible:ring-ring flex items-center gap-3 rounded-md border p-2.5 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none ${
                  selected
                    ? 'border-primary bg-accent/50'
                    : 'border-border/70 hover:border-primary/40'
                }`}
              >
                <span
                  aria-hidden
                  className="border-border/60 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border"
                  style={{ background: SWATCH_BG[p.value] }}
                >
                  {selected ? <Check className="text-primary h-4 w-4" aria-hidden /> : null}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{p.label}</span>
                  <span className="text-muted-foreground block truncate text-xs">
                    {p.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
