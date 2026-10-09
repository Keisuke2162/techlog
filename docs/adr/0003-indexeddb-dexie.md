# ADR-003: Phase 1 の保存先は IndexedDB (Dexie.js)

## Status

Accepted

## Context

Phase 1 は認証・DB なしでローカルで動かす。読書ログは増え続け、日付での集計が必要。

## Decision

- IndexedDB を Dexie.js で扱う
- `fake-indexeddb` を使って Vitest 環境で単体テストを実行する

## Alternatives

- localStorage → 容量 5MB、同期 API、インデックスなしで却下
- raw IndexedDB → API が煩雑で却下

## Consequences

- インデックスで日付・ステータスでの検索が高速
- スキーマバージョン管理（マイグレーション）が可能
- `useLiveQuery` も利用できるが Phase 1 では TanStack Query で統一し Phase 2 と同じ hooks を使う
