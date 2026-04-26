# 開発引継ぎ

更新日: 2026-04-26
現行本番: `v269`（統合プロジェクト GAS version 272 / 会員 split GAS version 25 / 管理者 split GAS version 31）
固定 deployment: 統合（公開ポータル）`@272` × 2本 / 会員 split `@25` / 管理者 split `@31`

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
10. `docs/151_RELEASE_STATE_v269_2026-04-26.md`
11. `docs/149_RELEASE_STATE_v268_2026-04-26.md`
12. `docs/147_RELEASE_STATE_v267_2026-04-26.md`
13. `docs/145_RELEASE_STATE_v266_2026-04-25.md`
14. `docs/143_RELEASE_STATE_v265_2026-04-25.md`
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

- `v269`: データ管理コンソール 論理削除済みレコードをデフォルト非表示。「削除済みも表示する」チェックボックス追加。
  詳細: `docs/151_RELEASE_STATE_v269_2026-04-26.md`
- `v268`: sendEmailWithValidatedFrom_ の Session.getEffectiveUser スコープエラー修正。入会申込メール送信不可バグ解消。
  詳細: `docs/149_RELEASE_STATE_v268_2026-04-26.md`
- `v267`: 公開ポータルヒーローセクション FOIC 修正。設定ロード前にデフォルト文字が瞬間表示されていた問題を解消。
  詳細: `docs/147_RELEASE_STATE_v267_2026-04-26.md`
- `v266`: 入会・登録メール設定UIを統合再設計。5種メール設定を1セクションに統合。個人・賛助会員メール個別ON/OFF追加。
  詳細: `docs/145_RELEASE_STATE_v266_2026-04-25.md`
- `v265`: 事業所会員入会時メールを代表者/メンバー別テンプレートに分離。職員追加承認時メール2種追加。
  詳細: `docs/143_RELEASE_STATE_v265_2026-04-25.md`
それより古いリリース: `docs/archive/release_history/`（v264: 141_, v263: 139_, v262: 137_, v261: 135_, v260: 133_ 他）

## 3. 次フェーズの優先順位

### 最優先

第三者評価（docs/109）起票の全セキュリティタスク（120/121/122/123/113）は **v263 時点で完了**。

残タスク:

| 優先度 | 内容 | 正本 |
|---|---|---|
| 📋 Backlog | パフォーマンス改善 | `docs/58_NEXT_TASK_PERFORMANCE_2026-04-09.md` |

### 操作者確認待ち

- `v269`: データ管理コンソール検索で削除フラグONが非表示になること。チェックボックスで切り替えられること。
- `v268`: 入会申込後に認証情報メールが正常に届くこと（送信元アドレス設定済みであること）。
- `v267`: 公開ポータルトップのヒーロータイトルが、設定ロード前に一切表示されないこと（スケルトンのみ表示）。
- `v266`: 管理設定「入会・登録メール設定」が1セクションに統合されていること。全5種メール設定が編集できること。全体マスタースイッチOFF→全メール停止が動作すること。
- `v265`: 事業所会員入会時に代表者・メンバーが異なる内容のメールを受け取ること。職員追加承認時に追加職員・代表者にメールが届くこと。

## 4. 既知の制約と注意事項

- `npx clasp run healthCheck` / `npx clasp run getDbInfo` は、3 プロジェクトとも `Unable to run script function` となることがある。既知の operator 権限依存課題として扱う。失敗時は `docs/16_INCIDENT_clasp_run_permission_2026-03-14.md` を参照。
- **v263 OAuth スコープ削減の影響**: v263 で不要スコープを削除した。既存の OAuth grant が失効した場合は `myaccount.google.com/permissions` でアプリを手動失効させ再承認する。
- `getAdminEmailAliases_()` は admin split の Gmail API / send-as alias 構成に依存する。alias が取得できない場合は `docs/archive/release_history/119_RELEASE_STATE_v255_2026-04-21.md` と `docs/16_INCIDENT_clasp_run_permission_2026-03-14.md` を先に確認する。
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
- 統合 fixed deployment 2 本: `@272`
- 会員 split: `@25`
- 管理者 split: `@31`
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
