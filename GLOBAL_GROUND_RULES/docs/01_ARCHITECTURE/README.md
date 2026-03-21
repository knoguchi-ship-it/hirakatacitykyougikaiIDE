# ARCHITECTURE ドキュメント方針

## 目的
人間とAIが同じ構造理解を共有するため、重要なアーキテクチャ情報をここに集約する。

## 最低限残すもの
- システム全体図
- 主要モジュールの責務
- データフロー
- 外部依存
- 認証 / 認可の流れ
- 状態遷移
- 障害時の影響境界

## 表現ルール
- 可能な限り Mermaid を使う
- 図とコードが一致していること
- 状態名、イベント名、テーブル名、キュー名は実装と同一にする
- 更新したら関連ADRとREADMEも見直す

## 推奨ファイル例
- `system-overview.md`
- `domain-model.md`
- `state-machines.md`
- `auth-flow.md`
- `async-processing.md`
- `failure-modes.md`
