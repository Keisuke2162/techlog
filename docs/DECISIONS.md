# 設計で明示されていない事項の判断記録

設計ドキュメントに書かれていない細部について、実装中に下した判断と理由を残す。

## 技術スタック・バージョン

- **Next.js 16 (App Router)** を採用。要件で指定された Next.js の最新。
- **React 19.3** / **Tailwind CSS v4** / **TypeScript 5**。create-next-app の既定を使用。
- **shadcn/ui は CLI による導入ではなく Radix + Tailwind で同等の UI コンポーネントを `src/shared/ui/` に自作**。
  - 理由: Tailwind v4 / Next.js 16 / React 19 の組合わせに対する shadcn/ui CLI の対応が追いついておらず、CLI の生成コードがそのまま動かない。設計の意図（コードとして所有できる UI 部品）は満たせるため、Radix を直接使う方針にした。
- **UI の lint-staged pre-commit** は `eslint --fix` + `prettier --write` のみ。test は `npm run check` で実行する。
  - 理由: コミットごとに全テストを回すとコミット速度が落ちる。テストは `check` 時点で担保する。

## データモデル

- ID は **UUID v7 (uuid パッケージ)** を使用。時系列ソート可能で、Phase 2 で DB の主キーにそのまま使える。
- Dexie のインデックスは以下に貼る: `articles` → `url`, `status`, `addedAt`, `lastReadAt`、`tags` → `name`、`readingLogs` → `articleId`, `readOn`, `[articleId+readOn]`。
- `tags.name` の一意性は **大小文字無視**。保存時に `name.trim()` のみ行い、比較時に `toLocaleLowerCase()` を使う。
- `articles.url` の重複チェックは **normalizeUrl 後の値** で判定。

## URL 正規化ルール

- プロトコルは小文字化
- ホスト名は小文字化、末尾ピリオドを除去
- `http://` → `https://` には変更しない（別サイトになる可能性があるため）。
- クエリから `utm_*`, `gclid`, `fbclid`, `mc_eid`, `mc_cid`, `ref`, `_hsenc`, `_hsmi` を除去
- パスの末尾スラッシュを除去（ルート `/` 以外）
- fragment (`#...`) は保持（ドキュメント内ページ番号などに意味があるため）
- 入力に対して失敗したら元の URL をトリムして返す（ユーザー入力をブロックしない方針）

## 進捗 → ステータス自動連動

- `progress 1〜99` → `reading`、`progress 100` → `done` + `finishedAt` 設定
- `done` を手動選択 → `progress = 100`、`finishedAt = now`
- `want` に戻す → `progress` は保持（読み直し想定）。`finishedAt` はクリア
- `reading` を手動選択 → `progress` が 0 または 100 なら前の値を保ったまま、`finishedAt` をクリア
- 進捗の `step` は 5。スライダーで動かすと 5 刻み、数値入力は 1 刻みで許可（スライダーのステップ外の値も受け入れる）

## 読書ログ

- `markReadToday`（今日読んだ）は進捗を変えずに `progressFrom === progressTo` のログを作成する
  - ヒートマップ側で `progressFrom === progressTo` を 10pt として計上
- 進捗を 50 → 70 に動かすと `progressFrom=50, progressTo=70` のログを 1 件作成
- 進捗を減らす方向にも動かせる（読み直し想定）が、`progressTo < progressFrom` のログはヒートマップのポイント計算では 0pt (差が負ならクランプ)

## ヒートマップ

- 1 日のポイント = `max(0, progressTo - progressFrom)` の合計、ただし `progressFrom === progressTo` のログは 10pt
- レベル境界: 0, 1-49, 50-99, 100-199, 200+
- 表示期間は過去 53 週。右端が今週で、モバイルでは最新週が見えるように初期スクロール位置を右端にする
- ストリークは **ローカル日付** で連続日数を数える。今日のポイントが 0 でも「昨日まで」の連続は維持する（表示は「現在のストリーク」と「最長ストリーク」の両方）

## タグ

- 色のプリセット: slate, red, orange, amber, yellow, lime, green, emerald, teal, cyan, sky, blue, indigo, violet, purple, fuchsia, pink, rose
- 新規タグはデフォルトで `slate`
- タグの統合は「統合先タグ」を選び、記事の tagIds を置き換えて元タグを削除する

## インポート/エクスポート

- JSON の `schemaVersion` は 1 (Phase 1)
- インポート時のモード: **マージ** (既存を保持し新規を追加、重複は updatedAt が新しい方を採用) / **置換** (全データ削除後にインポート)
- URL 重複は normalizeUrl 後に比較

## コンテキスト・UI 細部

- ダークモードは `next-themes` の `class` 戦略。初期値は `system`
- モーダル (Intercepting Routes `/articles/new`) は URL をそのまま維持、タブバックで一覧に戻る
- トースト通知は sonner、1 行で動詞から始める
- 1 画面に収まらない数値入力 (progress) はスライダー横の数値入力でも調整可能
- 削除確認ダイアログは記事とタグの両方に対して表示
- 空状態・ローディング・エラーのビューはすべて用意する
