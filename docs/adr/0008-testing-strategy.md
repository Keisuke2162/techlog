# ADR-008: テスト戦略

## Status

Accepted

## Context

ドメインロジック (進捗 → ステータス遷移、ログ生成、ヒートマップ集計) は正確性が重要。UI は主要フローを E2E でカバーしたい。

## Decision

- Vitest + Testing Library: ドメイン関数・ユースケース・コンポーネントの単体テスト
- Playwright: 主要フロー E2E (記事追加 → 進捗更新 → ヒートマップ反映、タグフィルタ)
- カバレッジ目標: `src/features/*/domain` と `src/features/*/application` で 90% 以上
- Dexie のテストは `fake-indexeddb` で実行

## Consequences

- ドメイン関数のリファクタに自信を持てる
- Playwright は時間がかかるので、CI では main への PR で実行する想定
