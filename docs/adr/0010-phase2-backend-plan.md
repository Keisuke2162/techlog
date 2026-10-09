# ADR-010 (Phase 2 予定): バックエンド

## Status

Proposed (Phase 2 開始時に再決定)

## Decision (暫定)

- ORM: Drizzle (型安全・軽量・SQL に近い)
- DB: ローカル開発は SQLite、本番は PostgreSQL (Neon 等)
- 認証: Auth.js (GitHub OAuth) — 技術ブログ読者はほぼ GitHub アカウントを持つため
- API: Route Handlers (REST)。`HttpArticleRepository` 等を実装してインターフェースに合わせる
- 移行: Phase 1 の JSON エクスポートをログイン後にインポート

## Consequences

- Phase 1 の `ArticleRepository` インターフェースと usecase は変更不要
- UI は Repository を注入する Context を切り替えるだけで動く想定
