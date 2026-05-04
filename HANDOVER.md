# 開発引継ぎ

更新日: 2026-05-03
現行本番: `v297`（統合プロジェクト GAS version 290 / 会員 split GAS version 44 / 管理者 split GAS version 57）
固定 deployment: 統合（公開ポータル）`@290` × 2本 / 会員 split `@44` / 管理者 split `@57`

## 1. 現行状態

- `public / member / admin` の 3 境界は確定済み。
- 会員ログインは `loginId + password` のみ。
- 管理者ログインは Google アカウント + whitelist 検証のみ。
- 会員マイページに管理者ログイン導線を戻さない。
- fixed deployment 2本運用を維持し、片系だけ更新しない。
- production fixed deployment 同期は `npx clasp redeploy ... --versionNumber ... --description ...` を標準とする。
- split project の広範な関数本体 pruning は v283 で破損したため停止中。public artifact は v289 で comment/string を除外した依存解析と top-level callable allowlist 検査を導入済み。
- release 前に `npm run security:public-boundary` を実行し、統合/public artifact の callable/action/HTML 境界が崩れていないことを確認する。
- `v291` で `npm run security:member-boundary` / `npm run security:admin-boundary` / `npm run security:split-boundary` を追加し、member/admin split artifact の top-level callable は `doGet` / `processApiRequest` のみに制限済み。

## 2. 最初に読む順序

1. `HANDOVER.md`
2. `AGENTS.md`
3. `GLOBAL_GROUND_RULES/docs/AI_RULES/05_PROJECT_RULES_HIRAKATA.md`
4. `GLOBAL_GROUND_RULES/docs/AI_RULES/00_OPERATING_MODEL.md`
5. `GLOBAL_GROUND_RULES/docs/AI_RULES/10_WORKFLOW_AND_QUALITY.md`
6. `GLOBAL_GROUND_RULES/docs/AI_RULES/20_SECURITY_APPROVALS.md`
7. `GLOBAL_GROUND_RULES/docs/AI_RULES/30_ERROR_MEMORY.md`
8. `GLOBAL_GROUND_RULES/docs/AI_RULES/40_DOCS_AND_TEACHING.md`
9. `docs/44_DEVELOPMENT_HANDOVER_PLAYBOOK_2026-04-04.md`
10. `docs/177_RELEASE_STATE_v297_2026-05-04.md`
11. `docs/176_RELEASE_STATE_v294_2026-05-03.md`
12. `docs/175_RELEASE_STATE_v293_2026-05-03.md`
13. `docs/174_RELEASE_STATE_v292_2026-05-01.md`
14. `docs/173_RELEASE_STATE_v291_2026-05-01.md`
14. `docs/169_RELEASE_STATE_v290_2026-04-29.md`
15. `docs/170_HANDOVER_SECURITY_SEPARATION_NEXT_2026-04-29.md`
16. `docs/168_RELEASE_STATE_v289_2026-04-29.md`
17. `docs/167_THIRD_PARTY_ASSESSMENT_PUBLIC_SEPARATION_2026-04-28.md`
18. `docs/166_RELEASE_STATE_v288_2026-04-28.md`
19. `docs/165_HANDOVER_PUBLIC_PORTAL_SEPARATION_PLAN_2026-04-28.md`
20. `docs/164_RELEASE_STATE_v287_2026-04-28.md`
21. `docs/163_RELEASE_STATE_v286_2026-04-28.md`
22. `docs/162_RELEASE_STATE_v285_2026-04-27.md`
23. `docs/161_RELEASE_STATE_v284_2026-04-27.md`
24. `docs/160_RELEASE_STATE_v283_2026-04-27.md`
25. `docs/159_RELEASE_STATE_v282_2026-04-27.md`
26. `docs/158_RELEASE_STATE_v281_2026-04-27.md`
27. `docs/157_RELEASE_STATE_v280_2026-04-27.md`
28. `docs/156_RELEASE_STATE_v279_2026-04-27.md`
29. `docs/155_RELEASE_STATE_v278_2026-04-27.md`
30. `docs/153_INCIDENT_DRIVE_PERMISSION_2026-04-27.md`
31. `docs/09_DEPLOYMENT_POLICY.md`
32. `docs/05_AUTH_AND_ROLE_SPEC.md`
33. `docs/04_DB_OPERATION_RUNBOOK.md`
34. `docs/03_DATA_MODEL.md`
35. `docs/00_DOC_INDEX.md`

## 3. 配信境界

| 用途 | Project | Deployment ID | Access |
|---|---|---|---|
| 会員マイページ | member split | `AKfycbxd_6HlH5aWLhxYOtLUHehI3ODiHg4fpc5SCzNdEBIDbDpaBuU3KTuqDRbeBmhWZxSQ_g` | `ANYONE_ANONYMOUS` |
| 管理者ポータル | admin split | `AKfycbwSCTTyvWY_cFG764XawdbqA8r0qxYbav4aDZ-BK9rRmvXHoUXrKQnQ9egRGqWcx4Os` | `DOMAIN` |
| 公開ポータル | 統合 public | `AKfycbxyuUXgK1oHUDMahQjluiL-gcrMK0qV0FWLFYaYBqGxlRSg9NhvmbyQRyf0dvaqg7Zp` | `ANYONE_ANONYMOUS` |

## 4. 直近リリース

- `v297`: 事業所職員を役員に割当て可能に（DB 3テーブルに職員ID 追加・双方向紐づけ変更・退職時自動退任）。admin split `@57`（clean）、会員 split `@44`。スキーマ移行適用済み（2026-05-04）。
- `v296`: 請求 UI フル実装。ClaimCard（会員マイページ）+ ClaimManagementConsole（管理者）+ GAS 10関数 + DriveApp ファイルアップロード（drive スコープ追加）。admin split `@55`（fix）、会員 split `@43`（fix）。
- `v295`: 役員管理フル実装。DB スキーマ（8テーブル）+ GAS API（19関数）+ フロントエンド UI（システム設定マスタ管理・役員割当て・口座管理・支払い履歴・会員ポータル役員表示）。admin split `@53`（clean）、会員 split `@41` へ同期。`rebuildDatabaseSchema` 適用済み（2026-05-03）。
- `v294`: 宛名リスト出力コンソールの文言を「年度処理」から「年会費納入」へ変更し、候補読み込み直後のデフォルト選択を未選択に変更。「表示中を選択」ボタンの強調色を解除。管理者 split を `@51` へ同期。詳細: `docs/176_RELEASE_STATE_v294_2026-05-03.md`
- `v293`: 宛名リスト出力コンソールの5列ドロップダウンフィルター（年度処理 / 種別 / 状態 / 郵送先 / 住所不備）を admin split に反映。管理者 split を `@50` へ同期。詳細: `docs/175_RELEASE_STATE_v293_2026-05-03.md`
- `v292`: `build-admin-gas.mjs` の pruning バグ修正。`ADMIN_ACTION_PERMISSIONS` が誤削除されていた問題（管理者ログイン不能・404）を解消。`build-member-gas.mjs` の同一パターンも同時修正。管理者 split を `@49` へ同期。詳細: `docs/174_RELEASE_STATE_v292_2026-05-01.md`
- `v291`: パスワード保存を versioned PBKDF2-HMAC-SHA256 + verifier-side pepper へ更新し、宛名リスト出力コンソールに発送区分・年度・検索・候補選択を追加。統合 fixed deployment 2本を `@290`、会員 split を `@40`、管理者 split を `@48` へ同期。詳細: `docs/173_RELEASE_STATE_v291_2026-05-01.md`
- `v290`: public artifact から admin cache / admin audit / admin role transition 系 private helper と maintenance 関数名 token を追加削除。統合 fixed deployment 2本を `@289` へ同期。詳細: `docs/169_RELEASE_STATE_v290_2026-04-29.md`
- `v289`: v288 第三者評価で検出された public callable `rebuildDatabaseSchema` / `getDbInfo` を public artifact から除去。build 後の top-level callable allowlist 検査を追加し、統合 fixed deployment 2本を `@288` へ同期。詳細: `docs/168_RELEASE_STATE_v289_2026-04-29.md`
- `v288`: 統合プロジェクトへ push する artifact を public-only `Code.gs` に縮退。公開ポータル URL / deployment ID は維持し、統合 fixed deployment 2本を `@287` へ同期。member split `@39` と admin split `@46` は未変更。詳細: `docs/166_RELEASE_STATE_v288_2026-04-28.md`
- `v287-partial`: member split の生成済み `Code.gs` から境界外関数を物理削除。admin split は `@47` でホワイトアウトしたため `@46` へロールバック済み。統合/公開は `@285` 維持。詳細: `docs/164_RELEASE_STATE_v287_2026-04-28.md`
- `v286`: `saveMemberCore_` の admin-only 代表者検証・監査ログを option 明示化。会員セルフ更新の機能変更なし。詳細: `docs/163_RELEASE_STATE_v286_2026-04-28.md`
- `v285`: `updateMember_` を admin wrapper、`saveMemberCore_` を実保存 core に分離。詳細: `docs/162_RELEASE_STATE_v285_2026-04-27.md`
- `v284`: v283 の member function pruning を撤回し、`addPublicStaffMember_ is not defined` を解消。詳細: `docs/161_RELEASE_STATE_v284_2026-04-27.md`
- `v283`: member split の到達不能トップレベル関数削除を試行。v284 で撤回。詳細: `docs/160_RELEASE_STATE_v283_2026-04-27.md`
- `v282`: member/admin split の境界外 action handler 分岐を生成時に削除。詳細: `docs/159_RELEASE_STATE_v282_2026-04-27.md`
- `v281`: member/admin split の境界外 action registry を物理的に空化。詳細: `docs/158_RELEASE_STATE_v281_2026-04-27.md`
- `v280`: 会員ログイン画面から管理者ログイン UI を除去。詳細: `docs/157_RELEASE_STATE_v280_2026-04-27.md`
- `v279`: app 境界 API gate を追加。詳細: `docs/156_RELEASE_STATE_v279_2026-04-27.md`
- `v278`: 研修表示・申込判定モデルを lifecycle と application availability に分離。詳細: `docs/155_RELEASE_STATE_v278_2026-04-27.md`

## 4.1 v294 反映済み変更（2026-05-03）

- 宛名リスト出力コンソールの「年度処理」表示を「年会費納入」へ変更。
  - フィルターラベル
  - アクティブチップ
  - キーワード検索 placeholder
  - 一覧テーブル見出し
- 発送対象の読み込み直後はデフォルト未選択に変更。
- 「表示中を選択」ボタンを他の選択操作ボタンと同じ白背景・slate border に統一し、強調色を解除。
- 管理者 split fixed deployment を `@51` へ同期。

## 4.2 v293 反映済み変更（2026-05-03）

- 宛名リスト出力コンソール（`src/components/MailingListExport.tsx`）の5列ドロップダウンフィルターを admin split に反映済み。
  - 年度処理 / 種別 / 状態 / 郵送先 / 住所不備
  - フィルター中はアクティブチップ表示・個別/一括リセット可能。
  - カウントバッジは「表示中かつ選択済み」件数を反映。
  - 全件選択はフィルター後の表示中のみ選択（Select All respects filters）。
- GAS 側 action の追加変更なし。admin HTML artifact のみ更新。
- 管理者 split fixed deployment を `@50` へ同期。

## 4.3 v292 反映済み変更（2026-05-01）

- `build-admin-gas.mjs` の `pruneUnreachableFunctionDeclarations` で `removableTopLevelStatements` フィルタの正規表現を `\b${name}\b` → `\b${name}\s*\(` に修正。関数呼び出しのみを削除対象とし、データ宣言内の文字列キーへの誤マッチを防止。
- `build-member-gas.mjs` の同一パターンも修正済み。
- admin split Code.gs に `ADMIN_ACTION_PERMISSIONS` が復元され、管理者ログイン（`checkAdminBySession` / `adminLoginWithData`）が正常動作するようになった。
- 管理者 split fixed deployment を `@49` へ同期。

## 4.4 v291 反映済み変更（2026-05-01）

- member/admin split artifact の top-level callable を `doGet` / `processApiRequest` のみに制限し、`npm run security:split-boundary` を prerelease gate に追加済み。
- パスワード保存を versioned PBKDF2-HMAC-SHA256 + verifier-side pepper 対応へ更新済み。pepper Script Property は `PASSWORD_HASH_PEPPER_V1`。integrated/public・member split・admin split の 3 project へ設定済み。pepper の値は Git、handover、docs、ログ、チャット、生成物へ記録しない。`.env` は Apps Script 本番 runtime の正本にしない。
- 会員が変更する新しいパスワードと生成パスワードは 15 文字以上へ変更済み。
- 宛名リスト出力コンソールを、発送区分・年度別の候補一覧表示、年度処理/種別/状態/住所不備表示、キーワード検索、選択対象のみ Excel 出力へ拡張済み。GAS 側で `getMailingListTargets` を追加し、`generateMailingListExcel` は選択 `targetKeys` を再照合する。
- 学習資料 `docs/learning/13_password_pepper_secret_management_2026-04-30.html` を追加。詳細: `docs/171_PASSWORD_HASH_STANDARD_ALIGNMENT_2026-04-30.md`
- Secret Manager 化および外部 KDF / managed identity 検討は 2026-05-01 時点で一旦保留。ただし必須 security backlog とし、完了または明示的な代替設計決定まで削除・完了扱いにしない。詳細: `docs/172_DEFERRED_SECURITY_BACKLOG_SECRET_MANAGER_KDF_2026-05-01.md`

## 5. 既知の重要事項

- `v288 third-party assessment`: `google.script.run` で呼べる `rebuildDatabaseSchema` / `getDbInfo` 残存を検出。v289 で public artifact から除去済み。詳細: `docs/167_THIRD_PARTY_ASSESSMENT_PUBLIC_SEPARATION_2026-04-28.md`, `docs/168_RELEASE_STATE_v289_2026-04-29.md`
- DriveApp 障害は解決済み。根本原因は GCP 標準 Cloud project `hcmn-member-system-prod`（88737175415）で Google Drive API が未有効化だったこと。詳細: `docs/153_INCIDENT_DRIVE_PERMISSION_2026-04-27.md`
- Google API 依存機能の障害では、コード調査前に GCP API 有効化、OAuth scope、Workspace 管理設定、実行ユーザー権限を確認する。
- `seedDemoData` は production DB を破壊する操作として扱い、完全バックアップと明示承認なしでは実行しない。
- business member の代表者情報は `staff.role='REPRESENTATIVE'` を正本とする。

## 5.3 v297 DB スキーマ移行（完了済み）

2026-05-04 に Apps Script エディタ（admin split）から `runRebuildSchemaForV297` を手動実行し、
T_役員・T_振込口座・T_請求 に `職員ID` 列を差分追加済み（既存データは保持）。
admin split を `@57`（clean）へ再デプロイ済み。

## 5.2 v296 会員マイページ OAuth 再承認（必須）

会員 split（member split）に `drive` スコープを追加したため、会員マイページへの初回アクセス時に OAuth 再承認が必要です。

手順:
1. [myaccount.google.com/permissions](https://myaccount.google.com/permissions) を開く
2. 「枚方市ケアマネ協議会 会員マイページ」（または類似名称）のアプリを探す
3. 「アクセス権を削除」をクリック
4. 会員マイページにアクセスすると再度権限許可ダイアログが表示される → 「許可」

> **影響範囲**: 会員マイページの全機能（会員情報・研修申込等）は再承認後も正常動作します。既存の member split デプロイ URL は変わりません。

## 5.1 v295 DB マイグレーション（完了済み）

2026-05-03 に Apps Script エディタ（admin split）から `runRebuildSchemaForV295` を手動実行し、以下の 8テーブルが本番スプレッドシートに追加済み:
- M_組織マスタ / M_役職マスタ / M_支払い種別マスタ
- T_役員 / T_振込口座 / T_支払い / T_支払い明細 / T_請求

一時関数は削除し、admin split を `@53`（clean）へ再デプロイ済み。

> **次回 clasp run が必要な場合**: `clasp run` は project-scoped OAuth が必要だが、push/redeploy には標準 `clasp login` で十分。

## 6. 未解消バグ（次担当者が最初に修正すること）

### BUG-001 【最優先】振込口座管理タブで事業所職員役員の口座登録・確認ができない

**症状**: 「振込口座管理」タブで事業所職員の役員を選択すると `（）` と空の番号が表示され、口座の登録・確認ができない。

**原因**: `src/components/OfficerManagement.tsx` の `BankAccountTab` コンポーネント内 dropdown の `value` が `o.会員ID` のため、事業所職員型役員（`会員ID` = empty、`職員ID` = filled）では空文字になる。

**修正場所**: `src/components/OfficerManagement.tsx` の `BankAccountTab` 内 `activeOfficers.map` および `handleSelectMember` 関数。

**修正方針**（詳細は `docs/177_RELEASE_STATE_v297_2026-05-04.md` §7 を参照）:
1. `personKey = o.職員ID || o.会員ID` を key として使用
2. `value` に `staff:${staffId}` / `member:${memberId}` の prefix を付与してタイプを区別
3. `handleSelectMember` で prefix を解析し、`staffId` か `memberId` を正しく渡す
4. `api.getAdminBankAccount / saveAdminBankAccount / deleteAdminBankAccount` の型に `staffId?: string` を追加

**確認後**: 事業所職員型役員を選択して口座の登録・表示・変更が正常動作すること。

---

## 7. 操作者確認待ち

- **会員マイページ OAuth 再承認**（§5.2 参照）— drive スコープ追加のため必要（未実施の場合）。
- **管理者ポータル**: 役員管理コンソールで事業所職員を役員に割当て → 「役員一覧」に表示されること。
- **管理者ポータル**: BUG-001 修正後、事業所職員役員の口座登録が動作すること。

---

# Next Handover Note（次担当者向け 包括引継ぎ）

## A. 最初にやること（必読順序）

1. **このファイル（HANDOVER.md）** — 全体把握
2. **`docs/177_RELEASE_STATE_v297_2026-05-04.md`** — 最新リリース・既知バグ
3. **`AGENTS.md`** — グランドルール（必ず遵守）
4. **`GLOBAL_GROUND_RULES/docs/AI_RULES/10_WORKFLOW_AND_QUALITY.md`** — 実装前の不明点確認ルール
5. **`docs/09_DEPLOYMENT_POLICY.md`** — デプロイ手順の正本
6. **`docs/170_HANDOVER_SECURITY_SEPARATION_NEXT_2026-04-29.md`** — セキュリティ分離残タスク

## B. 現行システム構成（2026-05-04 時点）

### 本番 Deployment

| 用途 | Deployment ID | Version |
|---|---|---|
| 公開ポータル（正式） | `AKfycbxy...` | @290 |
| 公開ポータル（legacy） | `AKfycbyw...` | @290 |
| 会員マイページ | `AKfycbxd...` | @44 |
| **管理者ポータル** | **`AKfycbwS...`** | **@57** |

### 本番スプレッドシート

DB スプレッドシート ID: `1GVlIzOG1Tsqw8fBXgZ__c8u4oMu-4_WCf0H3aVLESKs`（固定・変更禁止）

### 役員管理テーブル（v295〜v297 で追加）

| テーブル | 目的 |
|---|---|
| M_組織マスタ | 組織定義（本部・理事会等8組織）|
| M_役職マスタ | 役職定義（会長〜調査研究委員等14役職）|
| M_支払い種別マスタ | 支払い・請求種別（役員報酬・活動費等）|
| T_役員 | 役員割当て（会員ID または 職員ID との XOR 対応）|
| T_振込口座 | 役員の受取口座（1人1口座）|
| T_支払い + T_支払い明細 | 支払いヘッダー + 明細（ERP標準構造）|
| T_請求 | 役員の活動費等請求 |

### 重要な XOR 制約

T_役員・T_振込口座・T_請求 の人物識別:
- **個人・賛助会員**: `会員ID` = filled, `職員ID` = ''
- **事業所職員**: `会員ID` = '', `職員ID` = filled

GAS 関数・フロントエンドは常にどちらかを確認してから処理すること。

## C. 開発環境セットアップ

```bash
npm install          # 依存パッケージ
npx clasp login      # 標準認証（push/redeploy 用）
npx clasp show-authorized-user  # k.noguchi@hcm-n.org であること
```

## D. ビルド・リリース手順

### 通常リリース（admin/member split 変更時）

```bash
# 1. ビルド
npm run build:gas:admin   # → gas/admin/Code.gs + index.html
npm run build:gas:member  # → gas/member/Code.gs + index.html

# 2. 全ゲートチェック
npm run prerelease
# security:audit / security:public-boundary / security:split-boundary / typecheck

# 3. git diff で確認（他セッション変更の混在チェック）
git status --short
git diff

# 4. admin split デプロイ
cd gas/admin
npx clasp push --force
npx clasp version "vXXX 変更内容"
npx clasp redeploy AKfycbwSCTTyvWY_cFG764XawdbqA8r0qxYbav4aDZ-BK9rRmvXHoUXrKQnQ9egRGqWcx4Os \
  --versionNumber <N> --description "vXXX"

# 5. member split デプロイ
cd ../member
npx clasp push --force
npx clasp version "vXXX 変更内容"
npx clasp redeploy AKfycbxd_6HlH5aWLhxYOtLUHehI3ODiHg4fpc5SCzNdEBIDbDpaBuU3KTuqDRbeBmhWZxSQ_g \
  --versionNumber <N> --description "vXXX"

# 6. 確認
cd ../admin && npx clasp deployments --json
cd ../member && npx clasp deployments --json
```

### DB スキーマ変更時の追加手順

テーブル定義変更後は `rebuildDatabaseSchema` の実行が必要。

`clasp run` は通常認証では失敗する。**Apps Script エディタ経由で実行する**:
1. `gas/admin/Code.gs` の末尾に一時関数 `function runRebuildSchemaForVXxx() { ... }` を追加
2. `cd gas/admin && npx clasp push --force`
3. Apps Script エディタ（`https://script.google.com/d/1tlBJ-OJjqNQQxzb5tY3iRUlS4DmQD9sYqw5j842tXD1SPVHutBUeKTRi/edit`）から関数を選択・実行
4. 完了後、一時関数を削除し push → version → redeploy（clean）

### Pruning ビルドスクリプトの注意事項（v292・v296・v297 の教訓）

`build-admin-gas.mjs` / `build-member-gas.mjs` の `pruneUnreachableFunctionDeclarations` は:
- 文字列リテラルを除去してから `\b${name}\b` でマッチ（v296 修正済み）
- 関数呼び出し `name()` だけでなく値参照 `= name_` も除去対象
- `ADMIN_ACTION_PERMISSIONS` のような設定オブジェクト内の文字列キーへの誤マッチを防止

詳細: `memory/feedback_build_pruning_bug.md`

## E. 最優先タスク（次担当者が着手すること）

### タスク1【必須・バグ修正】BUG-001 振込口座タブの事業所職員対応

`docs/177_RELEASE_STATE_v297_2026-05-04.md` §7 参照。

修正ファイル: `src/components/OfficerManagement.tsx` の `BankAccountTab`

### タスク2【必須 Security Backlog】PBKDF2 work factor / Secret Manager 移行

詳細: `docs/172_DEFERRED_SECURITY_BACKLOG_SECRET_MANAGER_KDF_2026-05-01.md`

現状: PBKDF2-HMAC-SHA256 + verifier-side pepper は実装済みだが、OWASP 推奨 work factor（600,000回）未達。GAS の制約上 GAS 外での KDF 実装または Secret Manager への移行が必要。**このタスクは削除・完了扱い禁止。**

### タスク3【保留・セキュリティ改善】

| タスク | 状態 | 参照 |
|---|---|---|
| Public OAuth スコープ最小化 | 保留中 | `docs/170_HANDOVER_SECURITY_SEPARATION_NEXT_2026-04-29.md` §6 Task A |
| Admin physical pruning 安全再設計 | 保留中（@47 whiteout 教訓） | `docs/170` §6 Task B |
| Member split pruning 強化 | 保留中 | `docs/170` §6 Task C |
| 生成ファイルヘッダー追加 | 保留中 | `docs/170` §6 Task E |

## F. 重要な運用ルール（崩してはいけない事項）

1. **`clasp deploy` は全形式禁止** — URL が変わる。`clasp redeploy` のみ使用。
2. **4本の fixed deployment を必ず同期** — admin は @57、member は @44 の固定 ID を使用。
3. **`rebuildDatabaseSchema` に clasp run は使えない** — Apps Script エディタ経由で実行。
4. **pepper 値を記録しない** — `PASSWORD_HASH_PEPPER_V1` の値は Git/docs/chat/logs に記載禁止。
5. **管理者と会員は完全分離** — admin URL と member URL を混在させない。
6. **seedDemoData は本番 DB 破壊** — 完全バックアップと明示承認なしに実行禁止。
7. **不明点は必ず確認してから実装** — AGENTS.md §3 参照。
8. **実ブラウザ確認は操作者が行う** — AI/agent はコード整合・ビルド・API 確認を担当。

## G. 知っておくべき技術的制約

- **GAS 実行時間制限**: 6分。大量データ処理は分割実行が必要。
- **GAS ペイロード制限**: `google.script.run` の payload は数 MB 程度が上限。base64 ファイルは1件ずつ送信。
- **スプレッドシート DB**: SQL の JOIN 不可。GAS で全件取得後に JS でマッピング。
- **`clasp run` の制限**: 通常認証では失敗。project-scoped OAuth が必要だが Apps Script エディタ経由で代替可能。
- **admin split の `@47` whiteout**: 原因特定まで admin physical pruning の再デプロイ禁止。
- **member split の drive スコープ**: v296 で追加。初回アクセス時に OAuth 再承認が必要。
