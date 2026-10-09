# ADR-007: ヒートマップは自前実装 (CSS Grid)

## Status

Accepted

## Context

要件が明確（週×曜日・5段階）で、既存ライブラリに依存するほど複雑ではない。集計ロジックはテストしやすい形で持ちたい。

## Decision

- 週×曜日の CSS Grid で描画し、純粋関数で集計する
  - `aggregateDailyPoints` — ReadingLog から 日→ポイントのマップを作る
  - `toLevel` — ポイント → レベル (0〜4)
  - `buildCalendarGrid` — 1 年分のカレンダーグリッドを組み立てる
  - `calcStreak` — 連続読書日数を計算する
- 日付処理は `date-fns`。タイムゾーンはブラウザのローカル日付で `readOn` (YYYY-MM-DD) を確定する

## Consequences

- 集計ロジックは単体テストでカバーできる
- ライブラリの breaking change に左右されない
- モバイルでは最新週が見えるようにスクロール初期位置を調整する
