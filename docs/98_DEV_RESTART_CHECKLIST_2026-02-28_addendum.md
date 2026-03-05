# 開発再開チェック追記（2026-02-28）

## 実施概要
- ブラウザ実アカウント: `k.noguchi@uguisunosato.or.jp`
- `clasp` 再認可を `--use-project-scopes` で実施。
- 同意スコープは以下を確認:
  - `https://www.googleapis.com/auth/spreadsheets`
  - `https://www.googleapis.com/auth/script.external_request`

## 実施コマンドと結果
1. `npx clasp run getDbInfo`
   - 成功
   - 返却データに以下を確認:
     - スプレッドシートID: `1GVlIzOG1Tsqw8fBXgZ__c8u4oMu-4_WCf0H3aVLESKs`
     - シート一覧: `M_会員種別` ほかマスタ/テーブル一式
     - スプレッドシートURL: `https://docs.google.com/spreadsheets/d/1GVlIzOG1Tsqw8fBXgZ__c8u4oMu-4_WCf0H3aVLESKs/edit`

2. `npx clasp run --nondev getDbInfo`
   - 失敗（継続）
   - エラー: `Script function not found. Please make sure script is deployed as API executable.`

3. `npx clasp show-authorized-user`
   - `You are logged in as an unknown user.`
   - 備考: `--use-project-scopes` で `userinfo.*` を付与していないため表示上は unknown だが、`clasp run getDbInfo` は正常実行できる。

## 判断
- 疎通確認（開発再開の最小要件）は達成。
- 残課題は `--nondev` 経路のみ。

