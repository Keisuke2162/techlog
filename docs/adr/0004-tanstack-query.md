# ADR-004: サーバー状態管理に TanStack Query

## Status

Accepted

## Context

Phase 1 の非同期 Repository も Phase 2 の HTTP API も「非同期データ取得」として同じ扱いにしたい。進捗スライダーは楽観的更新で即時反映したい。

## Decision

- TanStack Query を導入し、キャッシュ・楽観的更新・リトライを委ねる
- UI ローカル状態は React state、フィルタ条件・URL 共有が必要な状態は `nuqs` で URL クエリに保持
- グローバルストア (Redux 等) は導入しない

## Consequences

- Phase 2 への移行時に hooks のコードが変わらない
- 楽観的更新と再フェッチが標準で使える
