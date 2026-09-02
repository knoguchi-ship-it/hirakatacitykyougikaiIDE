# Deployment Policy

Updated: 2026-09-02
Production: `v376.60` / integrated-public `@365` x2 / member split `@124` / admin split `@221`

> Current deployment IDs and versions are summarized in `HANDOVER.md`. This document defines the release procedure; older per-release entries below are historical records.

## 1. Purpose

- Keep member, public, and admin URLs stable.
- Sync every fixed deployment on each production release.
- Use terminal `clasp redeploy` as the standard production path.
- Avoid Apps Script UI manual deployment edits except for emergency recovery.
- Record deployment evidence in release state documents.

## 2. Fixed Deployment IDs

### Integrated public project

| Purpose | Deployment ID | Current version |
|---|---|---|
| Legacy member portal deployment | `AKfycbywpWoYxij6A-ZunIeBjG1Q8qX78PMMTsT3frx1cM5PJ2nAuZpz81KruXb5LIvWgbQx` | `@368` (`v376.63`) |
| Public portal | `AKfycbxyuUXgK1oHUDMahQjluiL-gcrMK0qV0FWLFYaYBqGxlRSg9NhvmbyQRyf0dvaqg7Zp` | `@368` (`v376.63`) |

### Split projects

| Purpose | Script ID | Deployment ID | Current version | Access |
|---|---|---|---|---|
| member | `1ZKFJKNr4IzbguZvO4KbtSOE1BzkrzOG8OV2tF0RFdk28EnZTCL4Sx3dJ` | `AKfycbxd_6HlH5aWLhxYOtLUHehI3ODiHg4fpc5SCzNdEBIDbDpaBuU3KTuqDRbeBmhWZxSQ_g` | `@127` (`v376.63`) | `ANYONE_ANONYMOUS` |
| admin | `1tlBJ-OJjqNQQxzb5tY3iRUlS4DmQD9sYqw5j842tXD1SPVHutBUeKTRi` | `AKfycbwSCTTyvWY_cFG764XawdbqA8r0qxYbav4aDZ-BK9rRmvXHoUXrKQnQ9egRGqWcx4Os` | `@224` (`v376.63`) | `DOMAIN` |

## 3. Standard Release Steps

### Pre-check

```bash
git status --short
git diff
npm run security:audit
npm run security:public-boundary
npm run security:split-boundary
npm run typecheck
npm run build:gas
```

If the release changes password verifier / credential generation, confirm the following before push / version / redeploy:

- `PASSWORD_HASH_PEPPER_V1` is set in integrated/public, member split, and admin split Apps Script projects with the same strong random value.
- The pepper value is not displayed, logged, pasted, or written to Git, docs, handover, generated files, terminal logs, or chat.
- `.env` is not the Apps Script production runtime source of truth. If used locally, it remains uncommitted and no value is documented.

If the release affects split projects, also run:

```bash
npm run build:gas:member
npm run build:gas:admin
npm run security:split-boundary
```

### Schema migration step (mandatory when DB schema columns change)

When a release adds, inserts, removes, or renames columns in any table or master sheet
(i.e. when `DB_SCHEMA_VERSION` is bumped or `テーブル定義` / `マスタ定義` is changed):

1. Before push, write or update `runRebuildSchemaForV<N>` (an explicit `clasp run` entry) for
   the new schema version. It must be safe to re-run and must call `initializeSchema_(ss)`.
2. After `clasp push` to the admin split project, run
   `npx clasp run runRebuildSchemaForV<N>` from `gas/admin/` so that
   `writeSheetHeaders_` and `normalizeTableColumns_` actually shift existing data rows
   into the new column layout. The `initializeSchemaIfNeeded_` runtime path is **not** a
   substitute - it can be skipped by the cached `SCHEMA_INITIALIZED_VERSION_KEY` property
   on certain code paths (this was the root cause of the 2026-05-12 schema-shift incident,
   `docs/204`).
3. Inspect Apps Script execution logs for any `auditDeleteFlagColumns_: schema-drift suspected`
   or `writeSheetHeaders_: schema drift detected` log entries. Both are surfaced as
   `Logger.log` warnings by the v342 sanity check. Investigate any non-zero report before
   proceeding to `clasp version`.
4. Record the manual rebuild result in the release state document.

### Push and Version

Use the project-specific directory for the target artifact.

```bash
npx clasp push --force
npx clasp version "<release note>"

cd gas/member
npx clasp push --force
npx clasp version "<release note>"

cd ../admin
npx clasp push --force
npx clasp version "<release note>"
```

### Fixed Deployment Sync

```bash
npx clasp redeploy AKfycbywpWoYxij6A-ZunIeBjG1Q8qX78PMMTsT3frx1cM5PJ2nAuZpz81KruXb5LIvWgbQx --versionNumber <version> --description "<release note>"
npx clasp redeploy AKfycbxyuUXgK1oHUDMahQjluiL-gcrMK0qV0FWLFYaYBqGxlRSg9NhvmbyQRyf0dvaqg7Zp --versionNumber <version> --description "<release note>"

cd gas/member
npx clasp redeploy AKfycbxd_6HlH5aWLhxYOtLUHehI3ODiHg4fpc5SCzNdEBIDbDpaBuU3KTuqDRbeBmhWZxSQ_g --versionNumber <version> --description "<release note>"

cd ../admin
npx clasp redeploy AKfycbwSCTTyvWY_cFG764XawdbqA8r0qxYbav4aDZ-BK9rRmvXHoUXrKQnQ9egRGqWcx4Os --versionNumber <version> --description "<release note>"
```

### Verification

```bash
npx clasp deployments --json
cd gas/member && npx clasp deployments --json
cd ../admin && npx clasp deployments --json
```

Real-browser verification is performed by the operator by default. The agent records code-level verification, build results, Apps Script command results, and browser-side confirmation points.

## 4. Done Criteria

- `git diff` and `git status --short` reviewed before push.
- Untracked files classified as tracked target or allowed local/generated artifact.
- `npm run security:audit` has no high or critical findings.
- `npm run security:public-boundary` passes for integrated/public artifacts.
- `npm run security:split-boundary` passes for member/admin split artifacts when split projects are built or released.
- Password verifier / credential generation releases include confirmed `PASSWORD_HASH_PEPPER_V1` setup in all 3 Apps Script projects without recording the value.
- `npm run typecheck` passes.
- Required build commands pass.
- `clasp push`, `clasp version`, and `clasp redeploy` succeed.
- `npx clasp deployments --json` confirms every fixed deployment points to the intended version.
- `HANDOVER.md`, this deployment policy, document index, and release state are updated.
- Browser-side residual checks are listed if not performed by the agent.

## 5. Prohibited Actions

- Do not use `clasp deploy --deploymentId` for production updates.
- Do not update only one fixed deployment.
- Do not call a release complete before source documents are updated.
- Do not use Apps Script UI deployment edits as the default path.
- Do not change production deployment IDs without recording the reason.
- Do not run `seedDemoData` against production without full backup and explicit approval.
- Do not redeploy historical admin split `@47` physical pruning output.

## 6. Current Recorded State

### 2026-09-02 v376.62 ← current production
- Scope: production defect fix. listMailTemplates failed for every category with
  "mailTemplateRecordFromRow_ is not defined" from v376.42 onward, because the
  build pruner counted only call syntax as a reference and therefore deleted a
  helper that is passed as a value (rows.map(mailTemplateRecordFromRow_)) from
  all three splits. Reachability now counts value references, the admin/member
  pruner copies scan a comment-masked body, addDeleteLogSheet gained a private
  implementation for the delete-cascade path, and a new gate
  (test:gas-artifact-refs) fails the release when a generated bundle references
  a gas-src function it does not declare. No schema change, no auth change.
- Fixed deployments: integrated/public @367 x2 / member @126 / admin @223.
- Verification: full pre-release gate passed, including the new gate, which was
  itself mutation-checked (it fails against the pre-fix artifacts). Generated
  artifacts re-verified in all 3 splits; artifacts got smaller, not larger
  (member -644 bytes, admin -196 bytes). Post-deployment live: all 14
  listMailTemplates categories returned status ok with counts matching the
  database; public a11y zero violations; public responsive 7/7; member
  responsive 7/7; admin responsive 7 viewports x 8 consoles = 56 views; mail
  settings E2E 5/5; dryRunTrainingEndTimeV376_61_LOG and
  dryRunMailTemplatesV376_43_LOG both passed:true. See
  docs/254_RELEASE_STATE_v376.62_2026-09-02.md.
- Rollback: integrated/public @366 x2 / member @125 / admin @222.

### 2026-09-02 v376.61
- Scope: training end-time (endTime) normalization. mapTrainingRowsForApi_ now
  returns HH:mm through the existing formatTimeOnly_ helper instead of passing a
  raw cell value through String(). A Date cell previously reached the admin
  console as a JS Date string, which the <input type="time"> control cannot
  accept, so the field rendered empty and saving cleared the stored end time.
  Adds a source-driven unit test and a non-sending operator dry-run
  (dryRunTrainingEndTimeV376_61_LOG). No schema change, no auth change.
- Fixed deployments: integrated/public @366 x2 / member @125 / admin @222.
- Verification: full pre-release gate passed, including the new
  test:training-time; the gate was mutation-checked (it fails against the
  pre-fix source). Generated artifacts verified in all 3 splits (top-level
  definitions retained, endTime normalized, no endTime: String( remaining, new
  dry-run separated into gas/admin/dryrun.gs). Deployment versions verified for
  all four fixed deployments. Post-deployment live checks: public a11y zero
  violations, public responsive 7/7 viewports, member portal responsive 7/7
  viewports with zero console errors. Admin browser E2E and Execution API
  dry-runs remain pending authenticated browser state and Execution API
  permission. See docs/253_RELEASE_STATE_v376.61_2026-09-02.md.
- Rollback: integrated/public @365 x2 / member @124 / admin @221.

### 2026-09-02 v376.60
- Scope: mail-delivery setting consolidation and application receipt correction.
  Persisted Boolean false now remains OFF; business application email resolves
  the REPRESENTATIVE staff role; automatic notifications use the configured
  shared automatic sender; templates remain editable while a notification is
  OFF. Explicit bulk/manual sender selection remains unchanged.
- Fixed deployments: integrated/public @365 x2 / member @124 / admin @221.
- Verification: pre-release gate and dedicated mail unit tests passed; generated
  artifacts were checked in all 3 splits; deployment-version verification passed;
  production public a11y passed with zero violations. Admin browser E2E and
  Execution API dry-runs remain recorded as FAIL/BLOCKED pending authenticated
  browser state and Execution API permission. See docs/archive/release_history/252_RELEASE_STATE_v376.60_2026-09-02.md.
- Rollback: integrated/public @364 x2 / member @123 / admin @220.

### 2026-07-19 v376.58
- Scope: GCP 移行 Phase 3（docs/250 §5・GCP 作業場 PHASE3_DESIGN §3）GcpApiClient read 実装。`src/shared/api-base.ts` の `callApi` に runtime 分岐（'gcp' 明示 config 時のみ `callGcpApi` fetch・allowlist は portal-api と同一の public 2 read action・allowlist 外 deny-by-default reject）、`GcpApiClient.callAction` を `callGcpApi` 委譲で実装、`AppRuntimeConfig.apiAuthToken`（ローカル検証専用・生成物非注入）追加。既定 'gas' 不変＝GAS 配信挙動不変。gas-src/Code.gs・DB schema・認証は不変。全 3 split 更新。
- Integrated fixed deployments: `@364` x2 ／ Member split: `@123` ／ Admin split: `@220`
- Verification: 新設 `test:gcp-transport` unit 10/10 を prerelease 連鎖へ追加し全ゲート PASS。3 split 生成物 grep（`__APP_CONFIG__={apiRuntime:'gas'}` のみ・apiAuthToken 値非注入・`var テーブル定義` 3/3・boot splash 残存・importmap 除去）PASS。3 project の `npx clasp deployments --json` で @364×2/@123/@220 同期確認。デプロイ後 live: 公開 `test:a11y` 違反 0・`test:responsive` 全 7VP PASS。member/admin は書込フロー変更なし（stub 到達不能）のため公開 E2E＋prerelease で非破壊判定。
- Rollback: public `@363` x2 ／ member `@122` ／ admin `@219` へ `npx clasp redeploy --versionNumber`。
- Detail: `docs/release-notes-2026.md` v376.58。

### 2026-07-11 `v376.57`
- Scope: GCP 移行 Phase 1（docs/250 §12.7-1）frontend transport 分離。`src/services/api.ts` に `createApiClient(config)` factory＋`GcpApiClient` の器（未実装 reject stub）＋`window.__APP_CONFIG__` 型を追加し、`scripts/compress-html.mjs` が GAS 配信 build に `apiRuntime:'gas'` を注入。既定は GasApiClient のままで挙動不変（非破壊）。gas-src/Code.gs・DB schema・認証は不変。全 3 split 更新。
- Integrated fixed deployments: `@363` x2 ／ Member split: `@122` ／ Admin split: `@219`
- Verification: `prerelease` 全ゲート / typecheck / 3 split build 再現性（rebuild 後 git clean） / 生成物 grep（`__APP_CONFIG__` 3/3・`var テーブル定義` 3/3・boot splash 残存・importmap 除去）PASS。3 project の `npx clasp deployments --json` で @363×2/@122/@219 同期確認。デプロイ後 live: 公開 `test:a11y` 違反 0・`test:responsive` 全 7VP PASS・`test:responsive:member` 全 7VP PASS（新 @122 で会員ログイン〜描画非破壊）。`test:responsive:admin` は同日 operator ログインで storageState 再取得後に実行し、全 7VP × 8 コンソール = 56 view 全 PASS（横スクロール 0・タップターゲット違反 0・console error 0）。3 split すべてで非破壊を機械検証済。
- Rollback: public `@362` x2 ／ member `@121` ／ admin `@218` へ `npx clasp redeploy --versionNumber`。
- Detail: `docs/release-notes-2026.md` v376.57。

### 2026-06-26 `v376.50`
- Scope: REDIRECT モードの件名・本文注釈を廃止。宛先は allowlist に集約しつつ、件名・本文は実送信時と同じ表示にする。元宛先・カテゴリは Apps Script log に記録。DB schema 不変、admin split のみ更新。
- Integrated fixed deployments: `@358` x2 ／ Member split: `@117` ／ Admin split: `@210`
- Verification: `build:gas:admin` / REDIRECT 注釈文字列 grep（該当なし） / admin 生成物の `var テーブル定義` and `processApiRequest` grep / `typecheck` / `test:mailing-list` / `prerelease` PASS。admin `npx clasp deployments --json` で `@210` 同期確認。操作者実機確認で REDIRECT 注釈が表示されないことを確認済。
- Detail: `docs/release-notes-2026.md` v376.50。

### 2026-06-26 `v376.49`
- Scope: admin split の Gmail send scope 復旧。一括メール送信で送信元 `from` 指定時に `GmailApp.sendEmail` へ分岐するが、admin manifest に `gmail.send` が欠落していたため全件権限不足で失敗していた。DB schema 不変、admin split のみ更新。
- Integrated fixed deployments: `@358` x2 ／ Member split: `@117` ／ Admin split: `@209`
- Verification: admin manifest JSON check / `build:docs-portal` / `test:er-sync` / `typecheck` / `test:mailing-list` / `prerelease` PASS。admin `npx clasp deployments --json` で `@209` 同期確認。`npx clasp run healthCheck --json` は Execution API 実行権限で失敗。操作者実機確認で一括メール送受信と添付ファイル送信が成功することを確認済。
- Detail: `docs/release-notes-2026.md` v376.49。

### 2026-06-18 `v376.48`
- Scope: 宛名リスト出力コンソールの「発送区分の選択」を `広報誌発送` / `広報誌のみ発送` / `お知らせ発送` の 3 択に修正。v376.47 の下段 `発送対象` フィルター案を廃止。DB schema 不変、admin split のみ更新。
- Integrated fixed deployments: `@358` x2 ／ Member split: `@117` ／ Admin split: `@208`
- Verification: `typecheck` / `test:mailing-list` 5 件 / 3 split build / 3 split `var テーブル定義` and `processApiRequest` grep / `prerelease` PASS。admin `npx clasp deployments --json` で `@208` 同期確認。`npm run test:responsive:admin` は再実行したが、保存済み storageState が Google ログインへ戻され `App frame did not appear within 50s` のため未 PASS。
- Detail: `docs/release-notes-2026.md` v376.48。

### 2026-06-18 `v376.47` (superseded by v376.48)
- Scope: 宛名リスト出力コンソールに発送対象フィルター（広報誌のみ / お知らせ発送対象）を追加。DB schema 不変、admin split のみ更新。
- Integrated fixed deployments: `@358` x2 ／ Member split: `@117` ／ Admin split: `@207`
- Verification: `test:mailing-list` 4 件追加、`prerelease` PASS、admin `npx clasp deployments --json` で `@207` 同期確認。`npx clasp run healthCheck` は Execution API 実行権限で失敗。`npm run test:responsive:admin` は通常経路で `ERR_NETWORK_ACCESS_DENIED`、承認経路で timeout のため未完了。実ブラウザ確認は `HANDOVER.md` §2-1 に操作者タスクとして残存。
- Detail: `docs/release-notes-2026.md` v376.47。

### 2026-06-11 `v376.46`
- Scope: 会計年度ステータス判定の単一情報源化（DRY 是正）。会員リストと宛先リスト出力の「在籍中」人数ぶれを解消。DB schema 不変、admin split のみ更新。
- Integrated fixed deployments: `@358` x2 ／ Member split: `@117` ／ Admin split: `@206`
- Verification: `test:member-fiscal-status` 11 件 PASS、`prerelease` PASS、admin `npx clasp deployments --json` で `@206` 同期確認。実機確認（会員リスト在籍中＝宛先リスト在籍中の一致）は `HANDOVER.md` §2-1 に操作者タスクとして残存。
- Detail: `docs/release-notes-2026.md` v376.46。

### 2026-06-10 `v376.43.1` current public/member artifact
- Scope: 全メール種別テンプレート管理 Phase B + build pruner hotfix。public/member 起動エラーをロールバック後に修正し、3 split に再反映。
- Integrated fixed deployments: `@358` x2 ／ Member split: `@117` ／ Admin split: `@203`
- Verification: 全 3 split に `var テーブル定義` 残存 grep 確認、公開 `test:a11y` 0 違反、`test:responsive` 7 VP PASS。
- Detail: `docs/release-notes-2026.md` v376.43 / v376.43.1。

### 2026-06-06 `v376.38`
- Scope: テスト観点表評価（`docs/247`）+ a11y AA コントラスト是正（`bg-sky-600`→`bg-sky-700`、`src/public-portal/App.tsx`）+ `npm audit fix`（moderate 7→5）。Code.gs に v376.36 archive 表定義(dormant・DB_SCHEMA_VERSION 不変)も同梱。
- Integrated fixed deployments: `@356` x2 ／ Member split: `@115` ／ Admin split: `@197`
- Verification: typecheck/build/boundary PASS。`npx clasp deployments --json` 一致確認。`npm run test:a11y` で critical/serious/moderate/minor=0 を live 再確認、`test:responsive` 全7VP PASS。

### 2026-06-03 `v376.35`
- Scope: 申込URL 無効時は公開ポータルの申込ボタン自体を非表示（閲覧のみ）。`trainingOptions.ts` を `resolveApplyCta()`（none/external/internal）へ。`PublicTrainingList` は none で CTA 非描画、公開 deep-link も none は申込画面に飛ばさない。admin 設定説明を更新。純フロント（GAS 不変）。
- Integrated fixed deployments: `@355` x2 ／ Member split: `@114` ／ Admin split: `@196`
- Verification: typecheck / build / boundary 監査 PASS。`npx clasp deployments --json` で一致確認。途中 clasp RAPT 失効（`invalid_rapt`）で再ログイン後に再開。

### 2026-06-01 `v376.34`
- Scope: 研修任意項目トグルを「有効/無効」化し公開申込画面に反映。`fieldConfig` を公開表示の単一情報源化（`src/shared/trainingOptions.ts`）。`PublicTrainingList` で無効項目を非表示、`申込URL` 無効時は内部申込フロー。admin トグルを「有効/無効」改称。純フロント（GAS 不変）。
- Integrated fixed deployments: `@354` x2 ／ Member split: `@113` ／ Admin split: `@195`
- Verification: typecheck / build / boundary 監査 PASS。`npx clasp deployments --json` で一致確認（member は一度自動版数取得ミスで @112 に出たため @113 へ再 redeploy 済）。実ブラウザ確認は操作者。

### 2026-06-01 `v376.33`
- Scope: 研修編集モーダルの入力フォーカス喪失バグ修正。`TrainingDetailModal` / `PdfPreviewModal` の focus 管理 `useEffect` 依存から `onClose` を外し（ref 経由参照・依存 `[open]` のみ）、入力1文字ごとの effect 再実行によるフォーカス奪取を解消。純フロント（GAS Code.gs 不変）。
- Integrated fixed deployments: `@353` x2（`PdfPreviewModal` 修正）
- Member split: `@112`（`PdfPreviewModal` 修正）
- Admin split: `@194`（`TrainingDetailModal` = 報告バグ本体 + `PdfPreviewModal`）
- Verification: `npm run typecheck` / build / boundary 監査 PASS（GAS コード不変）。`npx clasp deployments --json` で全 fixed deployment 一致確認。実ブラウザ確認は操作者。

### 2026-06-01 `v376.32`
- Scope: 公開ポータル研修ディープリンク。`doGet` が `e.parameter`（`t`=研修ID / `p`=page）を許可制 sanitize して `window.__DEEPLINK__` 注入。公開 SPA がロード後に1回適用。admin 研修管理に「申込リンク」コピー（正式 public URL を `src/config/publicPortal.ts` で定数化）。GAS 予約語 `c`/`sid` 不使用。
- Integrated fixed deployments: `@352` x2
- Member split: `@111`（共通 doGet 注入のみ・挙動不変）
- Admin split: `@193`
- Verification: `npm run typecheck` / build / `security:public-boundary`・`security:split-boundary` PASS（public top-level は `doGet`/`healthCheck`/`processApiRequest` のまま不変）。`npx clasp deployments --json` で全 fixed deployment の version 一致を確認。実ブラウザ確認は操作者（`HANDOVER.md` §2-1 #1）。

> 現行本番状態は本書冒頭ヘッダおよび `HANDOVER.md` を正とする。
> `v373` 以降の個別 release 記録は `docs/release-notes-2026.md` を参照。
> 以下は `v372.9` 以前の歴史的記録（historical records）。

### 2026-05-20 `v372.9`
- Scope: 名簿出力 Visual Designer S2。出力列を `@dnd-kit` で drag-drop 並び替え可能化。既存の ↑/↓ ボタンも残置。admin split のみ変更。
- Integrated fixed deployments: `@341` x2（変更なし）
- Member split: `@99`（変更なし）
- Admin split: `@145`
- Detail: `docs/archive/release_history/232_RELEASE_STATE_v372.9_ROSTER_S2_DRAG_DROP_2026-05-20.md`
- Verification: `npm run prerelease` PASS、`npx clasp deployments --json` で admin fixed deployment `@145` を確認済み。

### 2026-05-20 `v372.8`
- Scope: 名簿出力 Visual Designer S2 部分対応。列幅と日付/数値書式をテンプレ列へ設定できるようにし、プレビューと CSV 出力へ反映。admin split のみ変更。
- Integrated fixed deployments: `@341` x2（変更なし）
- Member split: `@99`（変更なし）
- Admin split: `@144`
- Detail: `docs/archive/release_history/231_RELEASE_STATE_v372.8_ROSTER_S2_FORMAT_WIDTH_2026-05-20.md`
- Verification: `npm run prerelease` PASS、`npx clasp deployments --json` で admin fixed deployment `@144` を確認済み。

### 2026-05-20 `v372.7`
- Scope: 第三者評価 #1 の是正。Drive bytes / thumbnail proxy を `T_研修.案内状URL` / `案内状サムネイルURL` に登録された fileId のみに制限し、未許可 fileId は fail-closed にする。
- Integrated fixed deployments: `@341` x2
- Member split: `@99`
- Admin split: `@143`
- Detail: `docs/230_SECURITY_REMEDIATION_DRIVE_PROXY_ALLOWLIST_2026-05-20.md`
- Verification: `npx clasp deployments --json` で integrated/public 2 本、member split、admin split の fixed deployment version を確認済み。

### 2026-05-17 `v370`
- Scope: v368 の Logger.log 内 `srcMemberId` undefined 参照を `sourceMemberId` に修正し、事業所入会申込承認時の partial 登録クラッシュを解消。admin HEAD には v370.1 の partial application 診断/cleanup helper も含む。
- Integrated fixed deployments: `@329` x2
- Member split: `@87`
- Admin split: `@129`
- Detail: `docs/archive/release_history/225_RELEASE_STATE_v360_to_v370_2026-05-17.md`
- Pending: `runRebuildSchemaForV360` の operator 実行、`runCleanupPartialBusinessV370_53779700` の operator 実行と再承認、v361 以降の実ブラウザ確認。

### 2026-05-16 `v361`
- Scope: v360 の研修名簿・出欠管理・一括メール明細を本番反映後、SheetJS xlsx dynamic import が `import.meta.url` を bundle に残して admin/member shell をクラッシュさせたため、xlsx を完全除去して UTF-8 BOM 付き CSV 出力へ切替。`scripts/compress-html.mjs` に build 時 `import.meta` 残存検知 gate を追加。
- Integrated fixed deployments: `@319` x2
- Member split: `@76`
- Admin split: `@117`
- Detail: `docs/224_RESUME_v360_2026-05-16.md` and `docs/archive/release_history/223_RELEASE_STATE_v360_2026-05-16.md`
- Pending: admin split で `runRebuildSchemaForV360` を 1 回実行し、Logger.log の `xorViolations: 0` と実ブラウザ動作を確認する。

### 2026-05-16 `v359`
- Scope: 会員ログイン UX / パスワード再設定を改善。会員ログインは `memberLogin` で認証を先に完了し、会員ポータルデータは遅延ロードへ変更。ログイン画面にログインID保存、パスワード表示/非表示、`ログインID + 登録メールアドレス` によるパスワード再設定メール送信を追加。事業所職員アカウントの登録メール正本は `T_事業所職員.メールアドレス`。確認コードは 30 分有効の短期キャッシュ hash 保存。
- Integrated fixed deployments: `@317` x2
- Member split: `@74`
- Admin split: `@115`
- Detail: `docs/archive/release_history/222_RELEASE_STATE_v359_2026-05-16.md`

### 2026-05-16 `v358`
- Scope: 案内 PDF lightbox プレビューを **高解像度 PNG (w2000) `<img>` モーダル** に着地。`getFileThumbnail_` に `size` パラメータ追加 + `extractDriveFileId_` 共通ヘルパー導入で URL parse 強化 (`/d/`, `?id=`, URL encode 対応)。Drive `/preview` iframe (v355) と blob URL iframe (v357) の構造的不可能性を確認し、安定経路に統一。
- Integrated fixed deployments: `@316` x2
- Member split: `@73`
- Admin split: `@114`
- Detail: `docs/archive/release_history/221_RELEASE_STATE_v354_to_v358_2026-05-16.md` (v354〜v358 統合)

### 2026-05-15 `v353`
- Scope: 会員マイページの「受付中の研修」(`src/components/TrainingApply.tsx`) を v352 と同じ A4 縦サムネイル + 詳細情報 2 カラムカードへ改修。v352 では誤って public portal を改修していた認識違いを修正。member split のみ更新。
- Integrated fixed deployments: `@311` x2 (unchanged, v352)
- Member split: `@68`
- Admin split: `@108` (unchanged, v350)
- Detail: `docs/archive/release_history/220_RELEASE_STATE_v353_2026-05-15.md`

### 2026-05-14 `v352`
- Scope: 公開ポータル「現在受付中の研修」一覧を A4 縦 PDF サムネイル + 詳細情報の 2 カラムカードへ再設計。`PdfThumbnail` に `aspectRatio` prop 追加。WCAG 2.5.5 / semantic HTML 準拠。public のみ更新、member/admin は v350 のまま。
- Integrated fixed deployments: `@311` x2
- Member split: `@66` (unchanged, v350)
- Admin split: `@108` (unchanged, v350)
- Detail: `docs/219_RELEASE_STATE_v352_2026-05-14.md`

### 2026-05-14 `v351` — **ROLLED BACK**
- Scope (intended): pdfjs-dist client-side レンダリングで 1 ページ目を即時生成。
- Cause of rollback: `pdfjs-dist/build/pdf.mjs:9421` の `import.meta.url` が `vite-plugin-singlefile` の plain `<script>` 化と組み合わさり、admin shell の bundle parse 時に `Uncaught SyntaxError: Cannot use 'import.meta' outside a module` を投げ、管理画面全体がクラッシュ。
- Action taken: 全 4 fixed deployment を `@309 x2 / @66 / @108` (`v350`) へ即時 redeploy 戻し。git 上の v351 commit (`606c520 / f1ed4be / 37d92c5`) は履歴として保持。
- Next attempt 方針: `@rollup/plugin-replace` で pdfjs-dist の `import.meta.url` を空文字置換、または Vite alias で patched build に差替え。memory: `feedback_pdfjs_dist_vite_singlefile_trap.md`
- Detail: `docs/218_RELEASE_STATE_v351_2026-05-14.md`

### 2026-05-14 `v350`

- Scope: 案内 PDF サムネイル運用強化。Web 検索（Latenode community / Drive API v3 file metadata guide）のベストプラクティスに基づき (1) `generateAndSaveThumbnailForPdf_` を `hasThumbnail` field + 5s×5 retry = 25s 同期に強化、(2) `processPendingThumbnails` を 10 分 trigger で後追い backfill 化、(3) `regenerateThumbnailForTraining` admin action + 編集モーダル「サムネイル再生成」ボタンを追加。
- Integrated fixed deployments: `@309` x2
- Member split: `@66`
- Admin split: `@108`
- Detail: `docs/217_RELEASE_STATE_v350_2026-05-14.md`
- Operator setup: Apps Script editor (admin) で `setupPendingThumbnailsTrigger` を 1 回 Run（10 分 trigger 登録）。

### 2026-05-14 `v349`
- Scope: 案内 PDF サムネイル問題の構造的解消。`uploadTrainingFile_` がアップロード時に PNG 1 ページ目を Drive 上に永続化（自分が今 createFile したばかりなので thumbnailLink が確実に取れる、identity 罠を回避）。`getFileThumbnail_` は PNG fileId から DriveApp.getBlob() するだけに簡素化。`saveTraining_` で旧ファイル trash、admin top-level `regenerateAllThumbnails` で既存研修の MASTER 一括 backfill。
- Integrated fixed deployments: `@308` x2
- Member split: `@65`
- Admin split: `@107`
- Detail: `docs/216_RELEASE_STATE_v349_2026-05-14.md`

### 2026-05-14 `v347`
- Scope: 案内 PDF サムネイル真因を本番ログ駆動で確定し修正。v346 で Authorization 付与しても `drive.google.com/thumbnail` は PDF を 403 で拒否することが判明。`getFileThumbnail_` を Drive REST API v3 `files.get?fields=thumbnailLink` → `lh3.googleusercontent.com/...` への Bearer 付き UrlFetchApp 二段構えへ書換。`CacheService` 1h TTL 維持、OAuth スコープ変更なし。
- Integrated fixed deployments: `@306` x2
- Member split: `@63`
- Admin split: `@105`
- Detail: `docs/215_RELEASE_STATE_v347_2026-05-14.md`

### 2026-05-13 `v345`
- Scope: 案内 PDF サムネイルが v344 後も「PDF プレビューを読み込めませんでした」を出していた真因を再特定し修正。`DriveApp.getThumbnail()` は PDF に対し常に null を返す Apps Script の既知制約だった。`getFileThumbnail_` を `UrlFetchApp(drive.google.com/thumbnail?id=...&sz=w400)` + base64 化へ書換、`CacheService` 1h TTL を追加。OAuth スコープ追加なし。（本番ログで 403 が残存したため v346/v347 で再改修）
- Integrated fixed deployments: `@304` x2
- Member split: `@61`
- Admin split: `@103`
- Detail: `docs/214_RELEASE_STATE_v345_2026-05-13.md`

### 2026-05-13 `v344`
- Scope: 案内 PDF サムネイル画像が全 3 ポータルで壊れた画像になっていた事象を修正。`drive.google.com/uc?export=view&id=...` の hotlink 制限が原因。PdfThumbnail を GAS `getFileThumbnail` proxy 経由の base64 data URL 取得に切替。3 境界 ACL / build allowlist / audit allowlist にも追加。
- Integrated fixed deployments: `@303` x2
- Member split: `@60`
- Admin split: `@102`
- Detail: `docs/213_RELEASE_STATE_v344_2026-05-13.md`

### 2026-05-13 `v343`
- Scope: 管理者ポータル「登録済み管理者アカウント」一覧の事業所職員紐付け行で「表示名」列が氏名を含まなかった事象を修正。`getAdminPermissionEntries_` で `staffMap[linkedStaffId]` も参照し `氏名（権限）` 形式へ統一。
- Integrated fixed deployments: `@302` x2（変更なし、v342 artifact）
- Member split: `@59`（変更なし、v342 artifact）
- Admin split: `@101`
- Detail: `docs/212_RELEASE_STATE_v343_2026-05-13.md`

### 2026-05-13 `v342`
- Scope: DB schema-shift 構造的再発防止。`writeSheetHeaders_` を name-based shift 対応にし、列追加・列名変更でデータ行が旧位置に残ることを防止。`auditDeleteFlagColumns_` を追加し、削除フラグ列に boolean 以外の値があれば Logger 警告。`docs/09` の release checklist に schema 変更時の `runRebuildSchemaForV<N>` 手動実行と警告ログ検査手順を追記。
- Integrated fixed deployments: `@302` x2
- Member split: `@59`
- Admin split: `@100`
- Detail: `docs/211_RELEASE_STATE_v342_2026-05-13.md`

### 2026-05-13 `v341`
- Scope: Fixes annual fee management -> member detail navigation so it does not depend on the admin member list being loaded. Public deployments unchanged.
- Integrated fixed deployments: `@301` x2（変更なし、v340 artifact）
- Member split: `@58`
- Admin split: `@99`
- Detail: `docs/archive/release_history/210_RELEASE_STATE_v341_2026-05-13.md`

### 2026-05-12 `v340`
- Scope: Adds the admin-only member status note field and deploys the schema initialization guard that prevents existing table headers from being rewritten before name-based migration.
- Integrated fixed deployments: `@301` x2
- Member split: `@57`
- Admin split: `@98`
- Detail: `docs/209_RELEASE_STATE_v340_2026-05-12.md`

### 2026-05-12 `v338`
- Scope: 管理者ポータルの会員一覧・年会費管理で、個人/賛助会員の勤務先事業所名検索が効かない不具合を修正。admin dashboard / annual fee API の `officeName` を `T_会員.勤務先名` 参照へ修正。
- Integrated fixed deployments: `@299` x2（変更なし、v335 artifact）
- Member split: `@55`（変更なし、v335 artifact）
- Admin split: `@96`
- Detail: `docs/207_RELEASE_STATE_v338_2026-05-12.md`

### 2026-05-12 `v337`
- Scope: v335 schema-shift incident の診断/復旧関数 cleanup を admin fixed deployment へ反映。public / member は変更なし。
- Integrated fixed deployments: `@299` x2（変更なし、v335 artifact）
- Member split: `@55`（変更なし、v335 artifact）
- Admin split: `@95`
- Detail: `docs/205_RELEASE_STATE_v337_2026-05-12.md`

### 2026-05-12 `v336`
- Scope: 会員管理コンソール（会員一覧）と年会費管理コンソールのキーワード検索で、個人/賛助会員の勤務先事業所名でもヒットするよう改善。会員一覧フィルタを共通 `matchesSearchQuery` に統一。
- Integrated fixed deployments: `@299` x2（変更なし、v335 artifact）
- Member split: `@55`（変更なし、v335 artifact）
- Admin split: `@94`
- Detail: `docs/203_RELEASE_STATE_v336_2026-05-12.md`

### 2026-05-12 `v335`
- Scope: 公開ポータル入会申込を変更申請キュー化。介護支援専門員番号による同一人物移行、`TRANSFERRED`、`T_会員.移行日`、`T_人物統合ログ` を追加。
- Integrated fixed deployments: `@299` x2
- Member split: `@55`
- Admin split: `@93`
- Detail: `docs/202_RELEASE_STATE_v335_2026-05-12.md`

### 2026-05-12 `v334`
- Scope: 役員管理で状態変更・役職・就任日・退任日・備考を編集可能化。役員管理ページの不要な全体データ取得を停止して読み込みを高速化。
- Integrated fixed deployments: `@298` x2
- Member split: `@54`
- Admin split: `@92`
- Detail: `docs/201_RELEASE_STATE_v334_2026-05-12.md`

### 2026-05-12 `v333`
- Scope: 役員向け請求を活動報告 / 経費請求の 2 系統へ分離。業務分類マスタ、全役員表示組織、HEIC/HEIF→JPG 変換、管理者確認 UI を追加。
- Integrated fixed deployments: `@297` x2
- Member split: `@53`
- Admin split: `@91`
- Detail: `docs/200_RELEASE_STATE_v333_2026-05-12.md`
- Note: pre-release backup via `clasp run` was blocked by Execution API permission. User explicitly approved proceeding with Google Sheets version history as rollback path.

### 2026-05-11 `v332`

- Scope: パスワード規約を 8〜20 文字へ調整し、規約パネルからセキュリティ理由文を除去。`getOfficerMasterData` の member sessionToken 付与漏れを修正し、ClaimCard の生エラーコード表示を利用者向け文言へ変更。
- Integrated fixed deployments: `@296` x2
- Member split: `@52`
- Admin split: `@90`
- Detail: `docs/archive/release_history/199_RELEASE_STATE_v320_to_v332_2026-05-11.md`

### 2026-05-06 `v308`

- Scope: 会員詳細編集画面の年会費表示を、2024 年度以降、当年度から過去 4 年分へ修正。
- Integrated fixed deployments: `@290` x2（変更なし）
- Member split: `@44`（変更なし）
- Admin split: `@68`
- Detail: `docs/193_RELEASE_STATE_v308_2026-05-06.md`

### 2026-05-06 `v307`

- Scope: 管理コンソールの会員詳細編集画面に、年会費の年度行ごとの表示・編集・保存機能を追加。
- Integrated fixed deployments: `@290` x2（変更なし）
- Member split: `@44`（変更なし）
- Admin split: `@67`
- Detail: `docs/192_RELEASE_STATE_v307_2026-05-06.md`

### 2026-05-06 `v306`

- Scope: 管理コンソールの保存後バックグラウンド再読込で member portal action を呼び得る状態管理を修正。年会費コンソール等の保存後に `unsupported_action` が App 全体の fatal error にならないようにした。
- Integrated fixed deployments: `@290` x2（変更なし）
- Member split: `@44`（変更なし）
- Admin split: `@66`
- Detail: `docs/190_RELEASE_STATE_v306_2026-05-06.md`

### 2026-05-05 `v305`

- Scope: 宛名リスト・名簿出力の年度基準判定を `getMemberFiscalSnapshot_()` へ共通化。年会費未納対象は選択年度内会員に限定し、年度内退会者は対象に含める。氏名検索は半角/全角スペース有無に依存しない共通検索へ修正。
- Integrated fixed deployments: `@290` x2（変更なし）
- Member split: `@44`（変更なし）
- Admin split: `@65`
- Detail: `docs/188_RELEASE_STATE_v305_2026-05-05.md`

### 2026-05-05 `v304`

- Scope: 会員管理コンソールの事業所職員一覧 UI を修正。タブ表示を「事業所職員」に変更し、詳細遷移対象を事業所名クリックのみに限定。氏名・カナは表示のみ、メール配信列を追加し、一括保存に対応。
- Integrated fixed deployments: `@290` x2（変更なし）
- Member split: `@44`（変更なし）
- Admin split: `@64`
- Detail: `docs/186_RELEASE_STATE_v304_2026-05-05.md`

### 2026-05-04 `v303`

- Scope: v302 の `staffRows` 追加後も旧 `adminDashboard` cache が残る条件を避けるため、`staffRows` なし cache を無視して再生成する guard を追加。
- Integrated fixed deployments: `@290` x2（変更なし）
- Member split: `@44`（変更なし）
- Admin split: `@63`
- Detail: `docs/184_RELEASE_STATE_v303_2026-05-04.md`

### 2026-05-04 `v302`

- Scope: 会員管理コンソールの事業所職員一覧を `T_事業所職員` 由来の `staffRows` で表示するよう修正。cache 集計と一覧のデータソース不一致を解消。
- Integrated fixed deployments: `@290` x2（変更なし）
- Member split: `@44`（変更なし）
- Admin split: `@62`
- Detail: `docs/183_RELEASE_STATE_v302_2026-05-04.md`

### 2026-05-04 `v301`

- Scope: 管理コンソール未反映報告を受け、v300 と同一機能差分の admin artifact を再生成して admin fixed deployment を再同期。
- Integrated fixed deployments: `@290` x2（変更なし）
- Member split: `@44`（変更なし）
- Admin split: `@61`
- Detail: `docs/182_RELEASE_STATE_v301_2026-05-04.md`

### 2026-05-04 `v300`

- Scope: 会員管理コンソールの事業所会員ビューを事業所職員一覧へ修正し、氏名・カナ・メール・区分・在籍状況の一括編集と一括保存に対応。
- Integrated fixed deployments: `@290` x2（変更なし）
- Member split: `@44`（変更なし）
- Admin split: `@60`
- Detail: `docs/181_RELEASE_STATE_v300_2026-05-04.md`

### 2026-05-04 `v299`

- Scope: 会員管理コンソールに事業所会員ビューを追加。追加 API なしで既存 state 派生により事業所番号・事業所名・代表者・職員情報を横断検索可能にした。
- Integrated fixed deployments: `@290` x2（変更なし）
- Member split: `@44`（変更なし）
- Admin split: `@59`
- Detail: `docs/180_RELEASE_STATE_v299_2026-05-04.md`

### 2026-05-04 `v298`

- Scope: 振込口座管理タブの事業所職員役員対応。管理 UI の対象役員選択を `member:<会員ID>` / `staff:<職員ID>` の discriminated key に変更し、`staffId` payload で口座取得・保存・削除できるよう修正。
- Integrated fixed deployments: `@290` x2（変更なし）
- Member split: `@44`（変更なし）
- Admin split: `@58`
- Detail: `docs/178_RELEASE_STATE_v298_2026-05-04.md`

### 2026-05-04 `v297`

- Scope: 事業所職員を役員に割当て可能にした。DB 3 テーブルへ `職員ID` を追加し、会員ID / 職員ID の XOR 制約、紐づけ変更、退職時自動退任を導入。
- Integrated fixed deployments: `@290` x2（変更なし）
- Member split: `@44`
- Admin split: `@57`
- Schema migration applied from Apps Script editor on 2026-05-04.
- Detail: `docs/177_RELEASE_STATE_v297_2026-05-04.md`

### 2026-05-03 `v296`

- Scope: 請求 UI フル実装。会員マイページの `ClaimCard`、管理者の `ClaimManagementConsole`、DriveApp ファイルアップロード、関連 GAS 関数を追加。member split に `drive` scope を追加したため、初回アクセス時に OAuth 再承認が必要。
- Integrated fixed deployments: `@290` x2（変更なし）
- Member split: `@43`
- Admin split: `@55`

### 2026-05-03 `v295`

- Scope: 役員管理フル実装。DB 8 テーブル、GAS API、システム設定マスタ管理、役員割当て、口座管理、支払い履歴、会員ポータル役員表示を追加。
- Integrated fixed deployments: `@290` x2（変更なし）
- Member split: `@41`
- Admin split: `@53`
- `runRebuildSchemaForV295` applied to production DB from Apps Script editor on 2026-05-03.

### 2026-05-01 `v291`

- Scope: パスワード保存を versioned PBKDF2-HMAC-SHA256 + verifier-side pepper へ更新。member/admin split boundary audit を prerelease gate 化。
- Integrated fixed deployments: `@290` x2
- Member split: `@40`
- Admin split: `@48`
- Detail: `docs/173_RELEASE_STATE_v291_2026-05-01.md`
