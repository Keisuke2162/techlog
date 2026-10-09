# ADR-005: バリデーションは Zod

## Status

Accepted

## Context

フォーム、インポート JSON、将来の API 入力など、複数レイヤーで同じ型・バリデーションを使いたい。

## Decision

- Zod スキーマをドメインに定義し、以下で共有する
  - React Hook Form (`zodResolver`)
  - JSON インポート検証
  - Phase 2 の API 入力検証
- `any` は使わない。外部入力はすべて Zod で検証する

## Consequences

- 型定義とバリデーションが二重管理にならない
- スキーマが同一であることで、Phase 2 の API も Zod で検証できる
