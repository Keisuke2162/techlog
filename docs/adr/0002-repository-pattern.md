# ADR-002: Repository パターンでデータ層を抽象化

## Status

Accepted

## Context

Phase 1 ではデータを IndexedDB に保存するが、Phase 2 では HTTP API に差し替える。UI とドメインロジックを書き直さずに保存先を切り替えたい。

## Decision

- `ArticleRepository` / `TagRepository` / `ReadingLogRepository` のインターフェースを `src/shared/repository/` に定義する
- 実装（Dexie 版・将来の HTTP 版）はインターフェースを満たし、React Context (`RepositoryProvider`) で注入する
- UI は hooks → usecase → Repository の順でのみデータに触れる

## Alternatives

- 最初から localStorage を直接触る → Phase 2 で全面改修が必要になるため却下
- Redux 等のグローバルストアに同期する → 複雑化するため却下。TanStack Query に委ねる

## Consequences

- UI コードを変更せずに Phase 2 への移行が可能
- テスト時にはインメモリ実装を差し込める
