# 開発引継ぎ

更新日: 2026-04-22
現行本番: `v260`（統合プロジェクト GAS version 258 / 会員 split GAS version 11 / 管理者 split GAS version 15）
固定 deployment: 統合（公開ポータル）`@258` × 2本 / 会員 split `@11` / 管理者 split `@15`

## 1. 再開の最短ルート

次担当者は、まず次の順で読む。

1. `HANDOVER.md`
2. `AGENTS.md`
3. `GLOBAL_GROUND_RULES/docs/AI_RULES/05_PROJECT_RULES_HIRAKATA.md`
4. `GLOBAL_GROUND_RULES/docs/AI_RULES/00_OPERATING_MODEL.md`
5. `GLOBAL_GROUND_RULES/docs/AI_RULES/10_WORKFLOW_AND_QUALITY.md`
6. `GLOBAL_GROUND_RULES/docs/AI_RULES/20_SECURITY_APPROVALS.md`
7. `GLOBAL_GROUND_RULES/docs/AI_RULES/30_ERROR_MEMORY.md`
8. `GLOBAL_GROUND_RULES/docs/AI_RULES/40_DOCS_AND_TEACHING.md`
9. `docs/44_DEVELOPMENT_HANDOVER_PLAYBOOK_2026-04-04.md`
10. `docs/133_RELEASE_STATE_v260_2026-04-22.md`
11. `docs/131_RELEASE_STATE_v259_2026-04-22.md`
12. `docs/129_RELEASE_STATE_v258_2026-04-22.md`
13. `docs/127_RELEASE_STATE_v257_2026-04-21.md`
14. `docs/125_RELEASE_STATE_v256_2026-04-21.md`
15. `docs/09_DEPLOYMENT_POLICY.md`
16. `docs/05_AUTH_AND_ROLE_SPEC.md`
17. `docs/04_DB_OPERATION_RUNBOOK.md`
18. `docs/03_DATA_MODEL.md`
19. `docs/00_DOC_INDEX.md`

補足:

- 5 version より古い release 記録は `docs/archive/release_history/` を参照する。
- 完了済み task / handover 個票は `docs/archive/historical/`、未採用または置換済みの個票は `docs/archive/obsolete/` を参照する。

## 2. 現在の本番状態

### 2.1 配信境界

| 用途 | プロジェクト | Deployment ID | URL | アクセス制御 |
|---|---|---|---|---|
| 会員マイページ | member split | `AKfycbxd...` | `https://script.google.com/macros/s/AKfycbxd_6HlH5aWLhxYOtLUHehI3ODiHg4fpc5SCzNdEBIDbDpaBuU3KTuqDRbeBmhWZxSQ_g/exec` | `ANYONE_ANONYMOUS` |
| 管理者ポータル | admin split | `AKfycbwS...` | `https://script.google.com/a/macros/hcm-n.org/s/AKfycbwSCTTyvWY_cFG764XawdbqA8r0qxYbav4aDZ-BK9rRmvXHoUXrKQnQ9egRGqWcx4Os/exec` | `DOMAIN` |
| 公開ポータル | 統合（公開専用） | `AKfycbxy...` | `https://script.google.com/a/macros/hcm-n.org/s/AKfycbxyuUXgK1oHUDMahQjluiL-gcrMK0qV0FWLFYaYBqGxlRSg9NhvmbyQRyf0dvaqg7Zp/exec` | `ANYONE_ANONYMOUS` |

固定運用:

- `public / member / admin` の 3 境界は確定済み。統合提案は禁止。
- `doGet` は `ScriptApp.getScriptId()` ベースで配信ページを固定する。`?app=` による迂回はしない。
- fixed deployment 同期は `npx clasp redeploy` を標準とし、Apps Script UI 手更新は障害復旧時のみ。
- 会員ログインは `loginId + password` のみ。
- 管理者ログインは Google アカウント + whitelist 検証。

### 2.2 直近で本番反映済みの変更

- `v260`: 公開ポータルに「会員登録情報を変更する」「退会を申し込む」カードと OTP 認証フローを追加。
  詳細: `docs/133_RELEASE_STATE_v260_2026-04-22.md`
- `v259`: 入会通知メールの送信元メールアドレスを設定化。主メールアドレスと Gmail send-as alias のみ選択可能。
  詳細: `docs/131_RELEASE_STATE_v259_2026-04-22.md`
- `v258`: 公開入会申込の事業所番号を半角英数字10文字へ統一。共有メール許容、空職員カード無視、データ管理コンソールを論理削除化。
  詳細: `docs/129_RELEASE_STATE_v258_2026-04-22.md`
- `v257`: システム設定画面を情報設計ごと再編。概要ヘッダ、クイックジャンプ、5 セクション、sticky 保存バーへ整理。
  詳細: `docs/127_RELEASE_STATE_v257_2026-04-21.md`
- `v256`: 公開ポータルの入会完了画面「今後のご案内」「ログイン情報」をシステム設定化。
  詳細: `docs/125_RELEASE_STATE_v256_2026-04-21.md`
- `v255`: admin split Gmail alias 取得の診断コードを整理し、GCP プロジェクト差し替え後の本番クリーン状態へ戻した。
  詳細: `docs/119_RELEASE_STATE_v255_2026-04-21.md`

## 3. 次フェーズの優先順位

### 最優先

| 優先度 | 内容 | 正本 |
|---|---|---|
| Critical | `processApiRequest` deny-by-default の完了 | `docs/120_TASK_SECURITY_DENY_BY_DEFAULT_2026-04-21.md` |
| Critical | 自己操作 API の IDOR 修正完了 | `docs/121_TASK_SECURITY_IDOR_FIX_2026-04-21.md` |
| High | パスワードハッシュを PBKDF2 以上へ移行 | `docs/122_TASK_SECURITY_PASSWORD_HASHING_2026-04-21.md` |
| Medium | OAuth スコープ最小化と CI セキュリティ自動化 | `docs/123_TASK_SECURITY_SCOPE_AND_CI_2026-04-21.md` |
| Medium | CM番号編集ポリシーの実装 | `docs/113_TASK_CM_NUMBER_EDIT_POLICY_2026-04-20.md` |

### 操作者確認待ち

- `v260`: 公開ポータルで「会員登録情報を変更する」「退会を申し込む」の 2 カードが表示されること。OTP メールが登録アドレスに届き、変更・退会フローが完了すること。
- `v259`: 管理設定で送信元メールアドレスを切り替え、入会通知メールが選択した alias で送られること。
- `v258`: 公開入会申込で、事業所番号 10 文字制御、共有メール許容、空職員カード無視、論理削除 UI の挙動を確認すること。

## 4. 既知の制約と注意事項

- `npx clasp run healthCheck` / `npx clasp run getDbInfo` は、2026-04-22 時点で 3 プロジェクトとも `Unable to run script function. Please make sure you have permission to run the script function.` となることがある。既知の operator 権限依存課題として扱う。
- `getAdminEmailAliases_()` は admin split の Gmail API / send-as alias 構成に依存する。alias が取得できない場合は `docs/119_RELEASE_STATE_v255_2026-04-21.md` と `docs/16_INCIDENT_clasp_run_permission_2026-03-14.md` を先に確認する。
- business member の代表者情報は `staff.role='REPRESENTATIVE'` を正本とする。
- `seedDemoData` は production DB を破壊する操作として扱い、完全バックアップと明示承認なしでは実行しない。
- demo login、mock member route、画面内 demo selector は復活禁止。

## 5. 再開時チェック

```bash
git status --short
npx clasp show-authorized-user
npx clasp deployments --json
cd gas/member && npx clasp deployments --json
cd gas/admin && npx clasp deployments --json
npx clasp run healthCheck
npx clasp run getDbInfo
```

期待値:

- authorized user: `k.noguchi@hcm-n.org`
- 統合 fixed deployment 2 本: `@257`
- 会員 split: `@10`
- 管理者 split: `@14`
- `clasp run` は権限状態次第で失敗し得る。失敗時は operator 側権限の再確認を優先する。

## 6. 文書の見方

- 文書構成の入口: `docs/00_DOC_INDEX.md`
- 運用フローの正本: `docs/44_DEVELOPMENT_HANDOVER_PLAYBOOK_2026-04-04.md`
- 現行仕様の正本:
  - 要件: `docs/01_PRD.md`
  - アーキテクチャ: `docs/02_ARCHITECTURE.md`
  - データモデル: `docs/03_DATA_MODEL.md`
  - DB 運用: `docs/04_DB_OPERATION_RUNBOOK.md`
  - 認証/認可: `docs/05_AUTH_AND_ROLE_SPEC.md`
  - デプロイ: `docs/09_DEPLOYMENT_POLICY.md`
  - 退会/削除: `docs/11_WITHDRAWAL_DELETION_POLICY.md`

## 7. 引継ぎ更新ルール

- コード、データ、UI、認証、デプロイ、運用手順を変えたら、同じターンで関連正本を更新する。
- 新しい release を出したら、`HANDOVER.md`、`docs/09_DEPLOYMENT_POLICY.md`、release state 文書を更新する。
- 完了済み task 個票は `docs/archive/historical/`、未採用または置換済みの task 個票は `docs/archive/obsolete/` へ移す。
- root `docs/` には「正本」「進行中タスク」「直近 5 version の release 記録」だけを残す。
