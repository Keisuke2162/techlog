# TechLog — 技術ブログ読書管理アプリ (Phase 1)

技術ブログを「読みたい・途中・読んだ」で管理し、進捗(%)・読書ログ・タグ・メモを記録する Web アプリ。
読書量を GitHub の草のようなヒートマップで可視化してモチベーションにする。

Phase 1 は認証なし・DB なし。ブラウザ (IndexedDB) にデータを保存し `npm run dev` だけで動く。

## 機能

- 記事の追加・編集・削除 (URL 重複チェック)
- ステータス管理 (読みたい / 途中 / 読んだ)
- 進捗 % スライダー + 数値入力 (楽観的更新)
- 自動連動: 進捗 1–99% → 途中、100% → 読了＋ `finishedAt` 記録
- 「今日読んだ」ボタンで進捗を変えずに記録
- 読書ログの履歴 (日付の修正・削除可)
- タグ: 入力補完・AND/OR フィルタ・名前色変更・削除・統合・まとめページ (Markdown エクスポート)
- 一覧: ステータスタブ・検索・ソート。フィルタ状態は URL クエリに保持 (`nuqs`)
- `/articles/new` を Intercepting Routes でモーダルとしても開く
- ヒートマップ (CSS Grid): 1 年分の読書量を 5 段階で表示、日付クリックでその日の記事一覧
- ストリーク (現在 / 最長)
- JSON エクスポート / インポート (マージ・置換モード, Zod 検証)
- 全データ削除
- ダークモード (`next-themes`)
- レスポンシブ (375px / 1280px)

## 起動

```bash
npm install
npm run dev        # http://localhost:3000
```

## スクリプト

```bash
npm run dev          # 開発サーバー
npm run build        # 本番ビルド
npm run start        # 本番サーバー
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm run test         # Vitest (ユニット)
npm run test:coverage
npm run test:e2e     # Playwright (E2E)
npm run check        # lint + typecheck + test + build + test:e2e (品質ゲート)
npm run format       # Prettier
```

## アーキテクチャ

```
UI (React Server/Client Components)
  ↓ hooks (TanStack Query)
Use Cases (アプリケーション層)
  ↓ Repository インターフェース
Repository 実装
  Phase 1: IndexedDB (Dexie)
  Phase 2: HTTP API → Route Handlers → Drizzle → DB
```

### ディレクトリ構成

```
src/
  app/                           # Next.js App Router (ルーティングのみ)
  features/
    articles/
      domain/                    # 型・Zod スキーマ・純粋関数
      application/               # ユースケース
      infrastructure/            # Dexie 実装
      ui/                        # コンポーネント・hooks
    tags/
    heatmap/
    data-io/
    dev/                         # シードデータ
  shared/
    ui/                          # 自作 shadcn/ui 風コンポーネント
    lib/                         # cn, 日付, URL 正規化, ID 生成
    hooks/
    repository/                  # Repository インターフェース & DI (Provider)
    providers/
docs/
  adr/                           # ADR 一式
  PROGRESS.md
  DECISIONS.md
```

### 技術スタック

- Next.js 16 (App Router) + React 19 + TypeScript (strict, noUncheckedIndexedAccess)
- Tailwind CSS v4 + Radix UI + lucide-react + sonner (shadcn/ui 風自作)
- TanStack Query (サーバー状態)
- Dexie.js (IndexedDB)
- Zod + React Hook Form
- nuqs (URL クエリ状態)
- date-fns
- Vitest + Testing Library + fake-indexeddb (ユニット)
- Playwright (E2E)
- Husky + lint-staged + Prettier + ESLint

## 品質ゲート

- `npm run check` が通る
- ドメイン / アプリケーション層のテストカバレッジ 90% 以上

## Phase 2 への差し替えポイント

- `src/shared/repository/types.ts` のインターフェースを満たす `HttpArticleRepository` 等を実装
- `src/shared/providers/repository-provider.tsx` の実装を切り替える
- ドメイン層・ユースケース・UI は変更不要

## ドキュメント

- [docs/adr/](docs/adr/) — 採用した技術と理由 (ADR)
- [docs/DECISIONS.md](docs/DECISIONS.md) — 設計に明示されていない事項の判断記録
- [docs/PROGRESS.md](docs/PROGRESS.md) — タスクの進捗
