# タスク: OAuth スコープ最小化・CI セキュリティ自動化

優先度: Medium
種別: セキュリティ是正
起票日: 2026-04-21
根拠: docs/109_THIRD_PARTY_ASSESSMENT_2026-04-20.md §5.5
OWASP: SSDF 1.1 Least Privilege / Security Automation

## 問題

### 1. OAuth スコープ過剰

`backend/appsscript.json` に不要スコープが含まれている可能性がある。  
`ANYONE_ANONYMOUS` の公開 Web アプリで実行者（`USER_DEPLOYING`）に広いスコープが付与されている。

確認対象:
- `cloud-platform` — Web アプリ runtime で本当に必要か
- `logging.read` — 書き込みのみのはずでは
- `script.projects` / `script.deployments` / `script.webapp.deploy` — CI/CD 用であり runtime 不要

### 2. CI セキュリティ自動化の欠如

- `npm audit` による dependency 脆弱性チェックが CI に入っていない
- secret scan（`.env`, API キー等の誤コミット検出）が未整備
- SAST / dangerous API scan が未実装

## 是正内容

### 1. スコープ棚卸しと最小化

各 appsscript.json（backend / gas/admin / gas/member）について:

| スコープ | 用途確認 | 判定 |
|---|---|---|
| spreadsheets | DB 読み書き | 必須 |
| script.external_request | UrlFetchApp | 必須 |
| script.send_mail | MailApp | 必須（統合・member） |
| gmail.send | GmailApp（未使用なら削除候補） | 要確認 |
| gmail.settings.basic | 送信エイリアス一覧取得 | admin のみ必須 |
| drive | ファイルアップロード | 統合のみ必須 |
| userinfo.email | セッション確認 | admin のみ必須 |

admin split で `drive` / `script.send_mail` が不要なら削除する。  
統合・member split で `gmail.settings.basic` が不要なら削除する。

### 2. CI セキュリティゲート追加

`package.json` の `scripts` に追加:

```json
{
  "security:audit": "npm audit --audit-level=high",
  "security:scan": "npx secretlint --secretlintrc .secretlintrc.json src/ backend/",
  "prerelease": "npm run security:audit && npm run type-check"
}
```

### 3. リリースチェックリスト更新

`docs/09_DEPLOYMENT_POLICY.md` に以下を追加:
- リリース前 `npm audit` 実行・High 以上がないこと
- `git log --diff-filter=A -- '*.env'` でシークレットファイルの誤コミットがないこと

## 完了条件

- 各プロジェクトの `appsscript.json` に不要スコープがない
- `npm run security:audit` が CI 相当で動作する
- デプロイ手順書にセキュリティチェック項目が記載されている
