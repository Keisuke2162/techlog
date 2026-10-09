# 進捗

| ID  | タイトル           | 状態 | 備考                                                      |
| --- | ------------------ | ---- | --------------------------------------------------------- |
| T1  | 基盤構築           | done | Next.js 16, Tailwind v4, Vitest, Playwright, Husky, ADR   |
| T2  | ドメイン・データ層 | done | Zod 型, 進捗/ステータス関数, Dexie 実装, usecase, DI      |
| T3  | 記事 CRUD          | done | 一覧/詳細/新規, nuqs, Intercepting Modal, 楽観的更新      |
| T4  | タグ               | done | 入力補完, AND/OR, 名前色変更, 統合, Markdown エクスポート |
| T5  | ヒートマップ       | done | 集計関数 + Grid UI + ストリーク + シード (30/1000)        |
| T6  | データ入出力       | done | JSON エクスポート/インポート (merge/replace), 全削除      |
| T7  | 仕上げ             | done | README, スクリーンショット, 性能確認                      |

## ブロック

なし

## 検証結果

- `npm run lint` ✅
- `npm run typecheck` ✅
- `npm run test` ✅ 90 件
- `npm run test:coverage` ✅ domain/application 97.61% stmts, 90.19% branches
- `npm run build` ✅
- `npm run test:e2e` ✅ 14 件 (smoke 4 + screenshots 10)
