# タスク: 自己操作 API の IDOR 修正（サーバー側 principal 検証）

優先度: Critical
種別: セキュリティ是正
起票日: 2026-04-21
根拠: docs/109_THIRD_PARTY_ASSESSMENT_2026-04-20.md §5.2
OWASP: A01 Broken Access Control / A07 Authentication Failures
ASVS: subject binding / access control 要求

## 問題

以下 API はクライアント申告の識別子（`loginId`, `memberId`, `staffId`）をそのまま信頼する。

| API | 問題箇所 |
|---|---|
| `updateMemberSelf` | `payload.loginId` で auth row を引く（line ~8349） |
| `applyTraining` | `payload.memberId` / `payload.staffId` を信頼 |
| `cancelTraining` | 同上 |
| `withdrawSelf` | 未調査 |
| `cancelWithdrawalSelf` | 未調査 |

`processApiRequest` の deny-by-default（docs/120）が入っても、認証済みユーザーが他会員の `loginId` を payload に入れて操作できる IDOR が残る。

## 是正内容

### 1. セッショントークン検証関数の実装

```js
function resolveMemberFromSession_(sessionToken) {
  // sessionToken を DB の T_認証 で照合
  // 有効期限・無効化フラグを確認
  // 対応する memberId と staffId を返す
  // 見つからなければ null を返す
}
```

### 2. 自己操作 API の書き換え

```js
function updateMemberSelf_(payload, sessionToken) {
  var principal = resolveMemberFromSession_(sessionToken);
  if (!principal) return { success: false, error: 'unauthorized' };
  // payload.loginId / memberId の信頼を停止
  // principal.memberId を使って更新対象を決定
  // ...
}
```

### 3. 対象 API 一覧（全件修正）

- `updateMemberSelf`
- `applyTraining`
- `cancelTraining`
- `withdrawSelf`
- `cancelWithdrawalSelf`

## 前提条件

- docs/120（deny-by-default）の実装が先か同時であること
- セッショントークンの仕様確認（現在の `T_認証` スキーマ）

## テスト

1. 会員 A のセッションで会員 B の `memberId` を payload に入れた `updateMemberSelf` → 403 エラー
2. 会員 A のセッションで正しく自己情報を更新できる
3. 研修申込・取消が正常に動作する

## 完了条件

- 全自己操作 API がサーバー側セッション検証を経ること
- クライアント申告の `loginId`/`memberId`/`staffId` を write 操作の主体として使わないこと
- 既存機能への副作用ゼロを確認
