# タスク: processApiRequest deny-by-default 実装

優先度: Critical
種別: セキュリティ是正
起票日: 2026-04-21
根拠: docs/109_THIRD_PARTY_ASSESSMENT_2026-04-20.md §5.1
OWASP: A01 Broken Access Control / A04 Insecure Design / A07 Authentication Failures
ASVS: Level 1 未達

## 問題

`backend/Code.gs` の `processApiRequest`（line ~989）は、`action` に対して deny-by-default を持たない。
公開 Web アプリ（`ANYONE_ANONYMOUS`）から内部 API（`fetchAllData`, `getAdminDashboardData`, `getMemberPortalData` 等）が呼べる状態。

会員一覧・職員一覧・loginId・メール・年会費情報が匿名で取得可能。

## 是正内容

### 1. 公開許可 allowlist の定義

```js
var PUBLIC_API_ALLOWLIST = {
  getPublicTrainings: true,
  applyTrainingExternal: true,
  cancelTrainingExternal: true,
  submitMemberApplication: true,
  getPublicPortalSettings: true,
};
```

### 2. processApiRequest の冒頭に deny-by-default を挿入

```js
function processApiRequest(action, payload, sessionToken) {
  if (!PUBLIC_API_ALLOWLIST[action]) {
    // 認証必須アクション: 会員セッションまたは管理者セッションを検証
    var authResult = verifySessionOrAdmin_(sessionToken, action);
    if (!authResult.ok) {
      return JSON.stringify({ success: false, error: 'unauthorized', code: authResult.code });
    }
  }
  // ... 以下既存ルーティング
}
```

### 3. 管理者専用 API に追加ガード

`fetchAllData`, `getAdminDashboardData` は `checkAdminBySession_()` が既にある箇所もあるが、
`processApiRequest` 入口でもはじくことで多層防御とする。

## 実装注意

- member split / admin split / 統合プロジェクトの全 Code.gs に反映必要
- `gas/admin/Code.gs` は `backend/Code.gs` からの手動 cp が必要（毎回）
- 変更後は全 3 プロジェクトをプッシュ・バージョン作成・`clasp redeploy`

## テスト

1. `curl -X POST <public-portal-url>/exec -d 'action=fetchAllData'` → 401/unauthorized を返すこと
2. `curl -X POST <public-portal-url>/exec -d 'action=getPublicTrainings'` → 正常レスポンスを返すこと
3. 管理者ポータル・会員マイページの既存機能が正常動作すること

## 完了条件

- `processApiRequest` に allowlist ベースの deny-by-default が実装されている
- 公開 API 5 件以外は認証なしで呼べないことを確認
- 既存機能への副作用ゼロを確認
