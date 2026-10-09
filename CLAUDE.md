# TechLog — 技術ブログ読書管理アプリ（Phase 1: ローカル版）

## 参照する設計（Notion）
- 要件: https://app.notion.com/p/3f4cce9226cc8000b501ed04c887e5f6
- アプリケーション設計: https://app.notion.com/p/3f4cce9226cc8195a97cf0fd614fa0c5
- アーキテクチャ・ADR: https://app.notion.com/p/3f4cce9226cc81079124eadbb6c9ee6e

## スコープ
- 対象: 設計ページの Phase 1 機能すべて（データは IndexedDB に保存し、npm run dev だけで動く）
- 対象外: DB、API、認証、外部 URL へのサーバーサイド fetch（タイトルは手入力）
- ただし Repository インターフェースを経由させ、後でバックエンドに差し替えられる構造にする

## 自律実行ルール
- 人間の承認を待たない。確認のために作業を止めない
- 設計に書かれていない細部は、設計の意図と一般的な UX に沿って自分で決める。
  決めた内容は docs/DECISIONS.md と Notion の実装記録に「判断と理由」として残す
- 設計と実装が矛盾するときは設計を優先する。設計自体に問題があると判断したら、
  よりよい案で実装し、ADR に追記して理由を残す
- 同じ問題で 3 回修正に失敗したら別のアプローチを試す。それでも解決しなければ
  PROGRESS.md に「ブロック」として記録し、ほかのタスクを先に進める。最後にもう一度挑戦する
- 実行してよいのはローカルでの操作だけ。git push、デプロイ、外部サービスへの書き込み
  （Notion の記録は除く）はしない

## 技術スタック
Next.js (App Router) / TypeScript strict / Tailwind CSS / shadcn/ui / TanStack Query /
Dexie (IndexedDB) / Zod / React Hook Form / date-fns / nuqs / Vitest / Testing Library / Playwright

## アーキテクチャ規約
- src/features/<feature>/{domain,application,infrastructure,ui} の構成を守る
- domain は React / Dexie / Next.js に依存しない純粋な TypeScript にする
- UI から Dexie を直接呼ばない。必ず hooks → usecase → Repository インターフェースを経由する
- Repository の実装は RepositoryProvider (Context) で注入する
- app/ 配下にはルーティングと組み立てだけを書き、ロジックは置かない
- 日付は ISO 8601 文字列で保存する。ヒートマップ用の readOn はローカル日付の YYYY-MM-DD
- any は使わない。外部入力（フォーム、インポート）は Zod で検証する

## コマンド
- npm run dev / build / lint / typecheck / test / test:e2e
- npm run check  # lint + typecheck + test + build + test:e2e（品質ゲート）

## 進捗管理
- docs/PROGRESS.md にタスク一覧と状態（todo / doing / done / blocked）を持つ
- 作業を始めるときは必ず PROGRESS.md を読み、未完了のタスクから再開する
- タスクが1つ終わるたびに PROGRESS.md を更新してコミットする

## 実装ループ（タスクごとに必ず回す）
1. 計画を PROGRESS.md に書く
2. 実装する（domain / application はテストを先に書く）
3. npm run check を実行する。失敗したら修正して再実行し、通るまで繰り返す
4. code-reviewer にそのタスクの差分をレビューさせる
5. Must と Should はすべて修正する。Nit は対応するか、見送る理由を記録する
6. 3〜5 を、Must/Should が 0 件で check が通るまで繰り返す
7. UI があるタスクは、Playwright のスクリーンショット（375px / 1280px）を自分で見て崩れを直す
8. Conventional Commits でコミットし、PROGRESS.md を done に更新する
9. Notion の要件ページ配下に「実装記録: T<番号> <タイトル>」を作成する
   （実装内容、主要ファイル、判断と理由、レビュー指摘と対応、テスト結果）

## 受け入れループ（全タスク完了後）
1. qa-tester に要件全体の受け入れ確認をさせる
2. FAIL と UX の問題を修正タスクとして PROGRESS.md に追加し、実装ループで直す
3. code-reviewer に全体を横断レビューさせ、Must/Should を直す
4. QA 全項目 PASS・横断レビューの Must/Should 0 件・check 通過を満たすまで繰り返す（最大 5 周）
5. 完了したら Notion の要件ページ配下に「Phase 1 完了レポート」を作成する
