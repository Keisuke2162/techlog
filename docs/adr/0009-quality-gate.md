# ADR-009: 品質ゲート

## Status

Accepted

## Context

CI でも手元でも、同じ基準で品質を検証したい。

## Decision

- `npm run check` に lint・typecheck・test・build・test:e2e を集約
- Husky + lint-staged でコミット時に ESLint / Prettier を自動実行
- Prettier は `prettier-plugin-tailwindcss` でクラス順を揃える

## Consequences

- どこで実行しても結果が同じ
- 迷ったら `npm run check` を実行すれば品質を保てる
