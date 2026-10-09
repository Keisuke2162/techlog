# ADR-001: Next.js App Router + TypeScript (strict)

## Status

Accepted

## Context

要件で Next.js の採用が指定されている。Phase 2 でバックエンド API を実装する必要があるため、同一リポジトリで UI と API を扱える構成が望ましい。

## Decision

Next.js (App Router) + TypeScript strict を採用する。
`noUncheckedIndexedAccess` を有効化し、配列・レコードアクセスの安全性を担保する。

## Consequences

- Phase 2 で Route Handlers / Server Actions を同じリポジトリに追加できる
- Phase 1 ではデータがブラウザにあるため主要画面は Client Component、レイアウト・静的部分は Server Component として分ける
- `any` の使用禁止、Zod による外部入力バリデーションを合わせて徹底する
