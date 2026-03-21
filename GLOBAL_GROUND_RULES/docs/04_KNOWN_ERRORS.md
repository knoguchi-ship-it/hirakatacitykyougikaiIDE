# 04_KNOWN_ERRORS

このファイルは、再発しやすい障害の原因と復旧手順を短く残すための運用メモである。  
新しい障害を解決したら、同じ形式で先頭へ追記すること。

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
