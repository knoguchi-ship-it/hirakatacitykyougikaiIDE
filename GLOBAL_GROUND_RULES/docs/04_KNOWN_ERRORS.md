# 04_KNOWN_ERRORS

このファイルは、再発しやすい障害の原因と復旧手順を短く残すための運用メモである。  
新しい障害を解決したら、同じ形式で先頭へ追記すること。

---

## [2026-04-03] seedDemoData による本番 DB 全データ消失

### 症状
- 管理コンソールの会員一覧に表示されるデータが激減した
- `T_管理者Googleホワイトリスト` の `紐付け会員ID` がデモ値（`99999999`）になった
- 本番会員・職員・研修申込・年会費データがすべてデモデータに置き換えられた

### 原因
- Playwright UI テストのデータ準備として `npx clasp run seedDemoData` を実行した
- `seedDemoData` は 8 テーブルを全削除してデモデータで再構築する破壊的関数
- 実行前に「本番 DB の全削除が起きる」旨の説明と許可確認を行わなかった
- `20_SECURITY_APPROVALS.md` の「データ更新は要承認」ルールは存在したが、「全削除」の重大性が明示されていなかった

### 削除されたテーブル
`T_会員` / `T_事業所職員` / `T_認証アカウント` / `T_ログイン履歴` / `T_管理者Googleホワイトリスト` / `T_研修` / `T_研修申込` / `T_年会費納入履歴`

### 切り分け
- 管理コンソールのコード不具合ではない
- フロントエンドのフィルタ設定変更でもない（FY フィルタは別問題）
- GAS の API 自体は正常動作している

### 復旧方針
Google スプレッドシートの版歴（ファイル → 変更履歴）から 2026-04-03 以前のバージョンを復元する。

### 復旧手順
1. スプレッドシート `1GVlIzOG1Tsqw8fBXgZ__c8u4oMu-4_WCf0H3aVLESKs` を開く
2. ファイル → 変更履歴 → 変更履歴を表示 で 2026-04-03 以前のバージョンを特定する
3. 対象バージョンを「この版を復元」で復元する
4. 復元後、管理コンソールでホワイトリスト `WL-001` の `紐付け会員ID` を正しい本番会員 ID に確認・修正する
5. `npx clasp run healthCheck` と `npx clasp run getDbInfo` で疎通確認する

### 再発防止
- `20_SECURITY_APPROVALS.md` に「DB 全削除・全更新の特別ルール」を追加済み（2026-04-04）
- `05_PROJECT_RULES_HIRAKATA.md` に `seedDemoData` は本番 DB 破壊的操作である旨を追記済み
- テスト前に必ずスプレッドシートの版歴バックアップが取れることを確認すること

### 関連情報
- 関連ファイル: `docs/42_SPEC_AUDIT_ADMIN_CONSOLE_2026-04-04.md`, `GLOBAL_GROUND_RULES/docs/AI_RULES/20_SECURITY_APPROVALS.md`
- 関連Issue/PR: コミット `599ba72`
- 関連ADR: —
- 一次ソース: `backend/Code.gs` `seedDemoData()` 行 1207

---

## [2026-03-22] Playwright MCP / `browserType.launchPersistentContext`
### 症状
- Playwright MCP のブラウザ起動に失敗する
- Chrome 側に「既存のブラウザ セッションで開かれています」相当のメッセージが出る

### 原因
- Playwright MCP が使う persistent profile に既存セッションが残っている
- browser/context/page の後始末不足で profile lock が再利用を阻害している

### 切り分け
- コード不具合ではない
- 本番アプリの認証要件変更でもない
- Google ログイン要件の変更と即断しない

### 復旧方針
- まず対象ブラウザを再起動し、browser/context/page を再取得してから再試行する

### 復旧手順
1. Playwright 側の browser を閉じる
2. persistent profile を使っている対象 browser を再起動する
3. context/page を取り直して再ナビゲートする

### 再発防止
- profile lock エラー直後にコード改変や認証仕様変更へ飛ばない
- Playwright の session 異常は `GLOBAL_GROUND_RULES/docs/AI_RULES/20_SECURITY_APPROVALS.md` のブラウザ自動操作ルールに従う

### 関連情報
- 関連ファイル: `GLOBAL_GROUND_RULES/docs/AI_RULES/20_SECURITY_APPROVALS.md`
- 関連Issue/PR:
- 関連ADR:
- 一次ソース: Playwright MCP / Chrome persistent profile

---

## [YYYY-MM-DD] エラー名 / 事象名
### 症状
- 何が起きたか
- どの画面・操作で起きたか

### 原因
- 判明した直接原因
- 背景要因

### 切り分け
- 何が原因ではなかったか
- どのログ / 設定 / コマンド / 画面を見れば見分けられるか

### 復旧方針
- 先に取るべき復旧の方向

### 復旧手順
1. 
2. 
3. 

### 再発防止
- 
- 

### 関連情報
- 関連ファイル:
- 関連Issue/PR:
- 関連ADR:
- 一次ソース:

---

## 運用ルール
- 「直った」だけではなく、「なぜ直ったか」まで書く
- セッション依存なら、その見分け方を書く
- バージョン依存なら、対象バージョンを書く
- 復旧前提と再発防止を分けて書く
