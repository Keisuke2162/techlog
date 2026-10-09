# ADR-006: UI は Tailwind CSS + shadcn/ui スタイル

## Status

Accepted

## Context

高速に UI を組み、カスタマイズと一貫性を両立させたい。アクセシビリティも担保したい。

## Decision

- Tailwind CSS v4 を採用
- shadcn/ui の設計思想（コードとして所有する UI 部品 + Radix UI プリミティブ）を採用
- Radix UI の primitive を直接依存に加え、`src/shared/ui/` に薄い wrapper を置く
- アイコンは lucide-react
- トーストは sonner

## Alternatives

- MUI / Chakra → バンドルサイズ・カスタマイズ性で劣るため却下
- CSS Modules のみ → デザインの一貫性を保つのが大変で却下

## Consequences

- UI コンポーネントが自分の資産になり、カスタマイズが自由
- Radix 由来のアクセシビリティ（キーボード操作、ARIA）が担保される
