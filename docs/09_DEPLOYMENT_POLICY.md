# Deployment Policy

Updated: 2026-04-16
Production: `v209` / fixed deployments `@209`

## 1. Purpose

- Keep member and public URLs stable.
- Sync both fixed deployments to the same version on every release.
- Standardize production sync on terminal `clasp` commands instead of ad hoc UI edits.
- Avoid `/exec` 404 regressions and accidental Web app type loss.

## 2. Fixed Deployment IDs

| Purpose | Deployment ID | URL |
|---|---|---|
| Member portal | `AKfycbywpWoYxij6A-ZunIeBjG1Q8qX78PMMTsT3frx1cM5PJ2nAuZpz81KruXb5LIvWgbQx` | `/exec` |
| Public portal | `AKfycbxyuUXgK1oHUDMahQjluiL-gcrMK0qV0FWLFYaYBqGxlRSg9NhvmbyQRyf0dvaqg7Zp` | `/exec?app=public` |

Both fixed deployments currently point to `@209`.

## 3. Standard Release Steps

### 3.1 Pre-checks

```bash
git status --short
npm run typecheck
npm run build
npm run build:gas
npx clasp show-authorized-user
npx clasp deployments
```

### 3.2 Push and version

```bash
npx clasp push --force
npx clasp version "release note"
npx clasp versions
```

### 3.3 Fixed deployment sync

Use terminal redeploy as the project standard.

```bash
npx clasp redeploy AKfycbywpWoYxij6A-ZunIeBjG1Q8qX78PMMTsT3frx1cM5PJ2nAuZpz81KruXb5LIvWgbQx --versionNumber <version> --description "<release note>"
npx clasp redeploy AKfycbxyuUXgK1oHUDMahQjluiL-gcrMK0qV0FWLFYaYBqGxlRSg9NhvmbyQRyf0dvaqg7Zp --versionNumber <version> --description "<release note>"
```

Fallback only:

- Use Apps Script UI `Deploy > Manage deployments` only when terminal redeploy is unavailable or emergency recovery requires it.
- If UI fallback is used, record the reason, operator, and evidence in `HANDOVER.md`.

### 3.4 Verification

```bash
npx clasp deployments --json
npx clasp run healthCheck
npx clasp run getDbInfo
```

Also verify the runtime in a real browser when the change affects user flows.

## 4. Done Criteria

- `typecheck`, `build`, and `build:gas` pass.
- `clasp push --force` and `clasp version` succeed.
- `npx clasp redeploy` succeeds for both fixed deployment IDs.
- `npx clasp deployments --json` shows both fixed deployments on the same target version.
- `healthCheck` and `getDbInfo` succeed.
- Source-of-truth documents are updated.

## 5. Prohibited Actions

- Do not use `clasp deploy --deploymentId` for production updates.
- Do not use Apps Script UI manual deployment sync as the default release path.
- Do not update only one of the two fixed deployments.
- Do not call a release complete before docs are updated.
- Do not change production deployment IDs without recording the reason.

## 6. First Troubleshooting Steps

### `/exec` returns 404

1. Check `npx clasp deployments --json`.
2. Retry `npx clasp redeploy` against the same fixed deployment ID.
3. If terminal redeploy is blocked, check Apps Script UI `Manage deployments`.
4. If UI fallback is used, record the reason and evidence before closing the release.

### `clasp run` fails

1. Check `npx clasp show-authorized-user`.
2. Read `docs/16_INCIDENT_clasp_run_permission_2026-03-14.md`.
3. Repair the operator auth state.

### Document mojibake appears

- Re-save in UTF-8 and re-open the file.
- Do not leave corrupted source documents in place.

## 7. Current Recorded State

### 2026-04-15 `v208`

- Version `208` created: 宛名リスト バグ2件修正。
  - Bug 1: 事業所会員の名前を `姓名` → `勤務先名` に修正。
  - Bug 2: `SpreadsheetApp.flush()` 追加（xlsx エクスポート前の書き込みバッファフラッシュ漏れ）。
- Both fixed deployments were synced to `@208` with `npx clasp redeploy`.
- Verification passed: `npm run typecheck`, `npm run build:gas`, `npx clasp deployments --json` (both @208).

### 2026-04-15 `v207`

- Version `207` created: 宛名リスト Excel 出力コンソール（MailingListExport）追加。
- GAS: `generateMailingListExcel_()` 新規追加（広報誌発送/お知らせ発送フィルタ、住所解決、xlsx エクスポート）。
- Frontend: `MailingListExport.tsx` 新規作成、Sidebar / App.tsx に `mailing-list-export` view 追加。
- Both fixed deployments were synced to `@207` with `npx clasp redeploy`.
- Verification passed: `npm run typecheck`, `npm run build:gas`, `npx clasp deployments --json` (both @207).

### 2026-04-15 `v206`

- Version `206` created: T_会員 に勤務先住所2・自宅住所2（建物名・部屋番号）列を追加。
- GAS: `テーブル定義.T_会員` に2列追加、全読み書き関数（fetch/create/submit/update）に対応追加。
  - `addAddressLine2Columns()` マイグレーション関数追加（冪等・本番DBへの列挿入用）。
  - OWASP Mass Assignment allowlist に新フィールドを追加。
- Frontend: `MemberForm.tsx` / `MemberDetailAdmin.tsx` で住所を「番地」と「建物名・部屋番号（任意）」の2フィールドに分割。
- Both fixed deployments were synced to `@206` with `npx clasp redeploy`.
- Verification passed: `npm run typecheck`, `npm run build:gas`, `npx clasp deployments --json` (both @206).
- **本番DB適用**: `npx clasp run addAddressLine2Columns` 実行済み。`T_会員` に `勤務先住所2` / `自宅住所2` を追加済み。

### 2026-04-11 `v197`

- Version `197` created: template help dialog + roster/reminder co-located template support.
- Both fixed deployments were synced to `@197` with `npx clasp redeploy`.
- Verification passed: `npm run typecheck`, `npm run build`, `npm run build:gas`, `npx clasp deployments --json`, `npx clasp run healthCheck`, `npx clasp run getDbInfo`.
- Real-browser UI interaction was attempted via local Vite + Playwright, but Playwright launch was blocked by an existing Chrome profile/session conflict in this environment.

### 2026-04-12 `v198`

- Version `198` created: dedicated template help page + template validation before save.
- Both fixed deployments were synced to `@198` with `npx clasp redeploy`.
- Verification passed: `npm run typecheck`, `npm run build`, `npm run build:gas`, `npx clasp deployments --json`, `npx clasp run healthCheck`, `npx clasp run getDbInfo`.
- Playwright browser verification was attempted, but browser launch was blocked by an existing Chrome profile/session conflict in this environment.

### 2026-04-12 `v199`

- Version `199` created: add direct sample-template link to the dedicated help page.
- Both fixed deployments were synced to `@199` with `npx clasp redeploy`.
- Verification passed: `npm run build:gas`, `npx clasp deployments --json`, `npx clasp run healthCheck`, `npx clasp run getDbInfo`.

### 2026-04-12 `v200`

- Version `200` created: rewrite the template help page in plainer Japanese for non-technical operators.
- Both fixed deployments were synced to `@200` with `npx clasp redeploy`.
- Verification passed: `npm run typecheck`, `npm run build`, `npm run build:gas`, `npx clasp deployments --json`, `npx clasp run healthCheck`, `npx clasp run getDbInfo`.
- Real-browser verification was intentionally skipped because the operator explicitly requested not to use Playwright MCP.

### 2026-04-13 `v201`

- Version `201` created: plain-language cleanup for the remaining template-help sections.
- Both fixed deployments were synced to `@201` with `npx clasp redeploy`.
- Verification passed: `npm run typecheck`, `npm run build`, `npm run build:gas`, `npx clasp deployments --json`, `npx clasp run healthCheck`, `npx clasp run getDbInfo`.
- Real-browser verification was not performed in this release.

### 2026-04-13 `v202`

- Version `202` created: removed the redundant top-right help button on the roster export page.
- Both fixed deployments were synced to `@202` with `npx clasp redeploy`.
- Verification passed: `npm run typecheck`, `npm run build`, `npm run build:gas`, `npx clasp deployments --json`, `npx clasp run healthCheck`, `npx clasp run getDbInfo`.
- Real-browser verification was intentionally skipped by operator instruction.

### 2026-04-14 `v205`

- Version `205` created: 1000-member scalable architecture for PDF roster export.
- GAS: `generateRosterZip_` replaced with 5 new functions — chunked, all-or-nothing, with retry.
  - `initRosterExport_`: creates Drive temp folder (folderId doubles as jobId).
  - `processRosterChunk_`: processes 250 members, PARALLEL_BATCH=15, MAX_RETRY=2 transient-error retries.
  - `finalizeRosterExport_`: unzips all partial ZIPs from temp folder, rezips into one final ZIP.
  - `cleanupRosterExport_`: deletes temp folder on error/abort.
  - `generatePdfsForIds_`: core PDF generation helper; returns `{blobs, failedIds, errors}` for retry control.
- Frontend: `RosterExport.tsx` updated with chunked flow + progress bar (chunk N/total, member count).
  - CHUNK_SIZE=250; frontend splits member IDs and calls processRosterChunk sequentially.
  - Partial-success UI removed (all-or-nothing guarantee).
- `api.ts`: `generateRosterZip` removed; 4 new methods added.
- Capacity: 203 members (1 chunk, ~3 min) ✅ / 500 (2 chunks) ✅ / 1000 (4 chunks, ~12 min total) ✅.
- Both fixed deployments were synced to `@205` with `npx clasp redeploy`.
- Verification passed: `npm run typecheck`, `npm run build:gas`, `npx clasp deployments --json` (both @205).

### 2026-04-14 `v204`

- Version `204` created: removed the 50-item PDF export limit from roster export console.
- GAS: `generateRosterZip_` rewritten — PARALLEL_BATCH=10 temp SS copies + `UrlFetchApp.fetchAll()` for parallel PDF generation. Pre-sorts members by type to minimize sheet visibility API calls. Estimated ~2-3 min for 203 members (within GAS 6-min limit).
- Frontend: removed `ROSTER_MAX_BATCH`, `overLimit` logic, warning badge, and button disable condition from `RosterExport.tsx`.
- Both fixed deployments were synced to `@204` with `npx clasp redeploy`.
- Verification passed: `npm run typecheck`, `npm run build:gas`, `npx clasp deployments --json` (both @204).

### 2026-04-13 `v203`

- Version `203` created: replaced the quick-start intro sentence with user-facing wording.
- Both fixed deployments were synced to `@203` with `npx clasp redeploy`.
- Verification passed: `npm run typecheck`, `npm run build`, `npm run build:gas`, `npx clasp deployments --json`, `npx clasp run healthCheck`, `npx clasp run getDbInfo`.
- Real-browser verification was intentionally skipped by operator instruction.

### 2026-04-11 HEAD-only (pre-release record)

- Workspace HEAD adds `REMINDER_TEMPLATE_SS_ID` and a co-located roster/reminder spreadsheet template example.
- Workspace HEAD changes roster template resolution to prefer developer metadata and keep `P_` / `B_` prefix fallback.
- Workspace HEAD changes roster data-sheet resolution to prefer `_DATA_ROSTER` and keep `_DATA` fallback.
- These changes were later released as `v197`.

### 2026-04-10 `v196`

- Version `196` created: Phase 3 PDF名簿出力コンソール（RosterExport）完了。SOW（Phase 1〜3）全フェーズ完了。
- GAS: `getMembersForRoster_` / `generateRosterZip_` 追加。テンプレートSS一時コピー → `_DATA`シート書き込み → flush() → UrlFetchApp PDF → Utilities.zip → Drive保存 → URL返却。
- Frontend: `src/components/RosterExport.tsx` 新規作成、Sidebar/App.tsx ルーティング追加。
- Both fixed deployments synced to `@196` with `npx clasp redeploy`.
- `npm run typecheck`, `npm run build:gas`, `npx clasp run healthCheck` passed.

### 2026-04-10 `v195`

- Version `195` created: Phase 2 会員一括メール送信コンソール（BulkMailSender）完了。
- GAS: `getMembersForBulkMail_` / `sendBulkMemberMail_` / `getEmailSendLog_` 追加。
  - INDIVIDUAL/SUPPORT: T_会員.代表メールアドレス。BUSINESS: T_事業所職員（メール配信希望コード ≠ 'NO'）。
  - GmailApp.sendEmail（from エイリアス）+ Drive自動添付（姓名部分一致）+ T_メール送信ログ記録。
  - getEmailSendLog_: EMAIL_LOG_VIEWER_ROLE 動的権限チェック。
- Frontend: `src/components/BulkMailSender.tsx` 新規作成、Sidebar/App.tsx ルーティング追加。
- Both fixed deployments synced to `@195` with `npx clasp redeploy`.
- `npm run typecheck`, `npm run build:gas`, `npx clasp run healthCheck` passed.

### 2026-04-10 `v194`

- Version `194` created: Phase 1 基盤整備完了。
- OAuthスコープ追加: `gmail.send`（GmailApp エイリアス送信）、`drive`（Drive フルアクセス）。**本番管理者の再認証が発生**。
- T_メール送信ログ シート新設（9列）。T_システム設定 3キー追加（ROSTER_TEMPLATE_SS_ID / BULK_MAIL_AUTO_ATTACH_FOLDER_ID / EMAIL_LOG_VIEWER_ROLE）。
- `updateSystemSettings_` にキー別権限チェック追加（EMAIL_LOG_VIEWER_ROLE は MASTER のみ変更可）。
- Both fixed deployments synced to `@194` with `npx clasp redeploy`.
- `npm run typecheck`, `npm run build:gas`, `npx clasp run healthCheck` passed.

### 2026-04-09 `v193`

- Version `193` created with admin auth caching: `checkAdminBySession_()` caches whitelist and auth rows in `CacheService.getScriptCache()` (TTL 300s) to speed up warm-instance admin logins.
- Fixed deployment whitelist cache invalidated on save/delete of admin permissions.
- Both fixed deployments synced to `@193` with `npx clasp redeploy`.
- `npm run typecheck`, `npm run build:gas`, `npx clasp run healthCheck` passed.

### 2026-04-09 `v192`

- Version `192` created: admin login changed from `adminLoginWithData` to `checkAdminBySession` only (auth without full data load).
- Both fixed deployments synced to `@192` with `npx clasp redeploy`.
- `npm run typecheck`, `npm run build:gas`, `npx clasp run healthCheck` passed.

### 2026-04-09 `v191`

- Version `191` created with custom deflate-raw+base64 HTML compression (`scripts/compress-html.mjs`).
- Both fixed deployments synced to `@191` with `npx clasp redeploy`.
- `npm run typecheck`, `npm run build:gas`, `npx clasp run healthCheck` passed.
- member portal: 522 kB → 206 kB (-59.6%). public portal: 317 kB → 150 kB (-51.7%).
- GAS CSP compatible: uses new Function() instead of import(blob:).

### 2026-04-09 `v190`

- Reverted to `vite-plugin-singlefile` (v189 caused blank screen — GAS CSP blocked blob: import).

### 2026-04-09 `v189` (FAILED — immediate rollback)

- `vite-plugin-singlefile-compression` caused blank screen: GAS CSP blocks `import(blob:)`.
- Rolled back via v190 within same session.

### 2026-04-09 `v188`

- Version `188` created with performance improvements (Phase 1-2): B-01/B-03/B-04 backend, B-05/B-06 frontend, Terser minification, Gemini AI moved to GAS.
- Both fixed deployments synced to `@188` with `npx clasp redeploy`.
- `npm run typecheck`, `npm run build:gas`, `npx clasp run healthCheck` passed.

### 2026-04-09 `v185`

- Version `185` created with `npx clasp version "v185 annual fee: auto-fill today as payment date when status set to PAID"`.
- Both fixed deployments synced to `@185` with `npx clasp redeploy`.
- Verified with `npx clasp deployments --json`.
- `npm run typecheck`, `npm run build:gas`, `npx clasp run healthCheck` passed.
- This release adds automatic payment date population: when the annual fee status is changed to PAID in the admin console, `confirmedDate` is set to today's ISO date and the display input shows today in YYYY/MM/DD format immediately.

### 2026-04-09 `v184`

- Version `184` created with `npx clasp version "v184 batch editor: click name to open detail, auto-fill date on status change"`.
- Both fixed deployments synced to `@184` with `npx clasp redeploy`.
- Verified with `npx clasp deployments --json`.
- `npm run typecheck`, `npm run build:gas`, `npx clasp run healthCheck` passed.
- This release adds two features to the batch member editor: (1) clicking the name/ID cell opens the individual detail page; (2) changing the status auto-fills withdrawn/joined dates based on fiscal year rules (WITHDRAWN→previous FY end, WITHDRAWAL_SCHEDULED→current FY end, ENROLLED→clear withdrawn date and set joined date to today).

### 2026-04-09 `v183`

- Version `183` created with `npx clasp version "v183 apply migration-period empty-field allowance to MemberForm and MemberDetailAdmin"`.
- Both fixed deployments synced to `@183` with `npx clasp redeploy`.
- Verified with `npx clasp deployments --json`.
- `npm run typecheck`, `npm run build:gas`, `npx clasp run healthCheck` passed.
- This release extends the migration-period required-field allowance (originally applied to StaffDetailAdmin in v182) to MemberForm (member self-edit) and MemberDetailAdmin (admin member edit). Fields that were originally empty in the DB are allowed to remain empty on save.

### 2026-04-09 `v182`

- Version `182` created with `npx clasp version "v182 allow empty required fields that were initially blank in staff edit form"`.
- Both fixed deployments synced to `@182` with `npx clasp redeploy`.
- Verified with `npx clasp deployments --json`.
- `npm run typecheck`, `npm run build:gas`, `npx clasp run healthCheck` passed.
- This release relaxes required-field validation in StaffDetailAdmin.tsx: fields that were originally empty in the DB are allowed to remain empty on save (data migration period accommodation).

### 2026-04-08 `v177`

- Version `177` created with `npx clasp version "v177 add configurable annual fee transfer account and show member name in current status"`.
- Both fixed deployments synced to `@177` with `npx clasp redeploy`.
- Verified with `npx clasp deployments --json`.
- `npm run typecheck`, `npm run build`, `npm run build:gas`, `npx clasp run healthCheck`, and `npx clasp run getDbInfo` passed.
- This release adds a configurable common annual-fee transfer account via `T_システム設定.ANNUAL_FEE_TRANSFER_ACCOUNT` and shows the logged-in member name in the current-status card.

### 2026-04-08 `v176`

- Version `176` created with `npx clasp version "v176 show current fiscal year annual fee as unpaid when eligible and record is missing"`.
- Both fixed deployments synced to `@176` with `npx clasp redeploy`.
- Verified with `npx clasp deployments --json`.
- `npm run typecheck`, `npm run build`, `npm run build:gas`, `npx clasp run healthCheck`, and `npx clasp run getDbInfo` passed.
- This release supplements the current fiscal year as `未納` on the member page when the member is annual-fee eligible and the current-year record does not yet exist.

### 2026-04-08 `v175`

- Version `175` created with `npx clasp version "v175 replace admin-facing member copy with user-friendly read-only wording"`.
- Both fixed deployments synced to `@175` with `npx clasp redeploy`.
- Verified with `npx clasp deployments --json`.
- `npm run typecheck`, `npm run build:gas`, `npx clasp run healthCheck`, and `npx clasp run getDbInfo` passed.
- This release removes remaining admin-facing wording from member-facing read-only sections.

### 2026-04-08 `v174`

- Version `174` created with `npx clasp version "v174 remove internal member-facing mode labels and add configurable annual-fee payment guidance"`.
- Both fixed deployments synced to `@174`.
- Verified with `npx clasp deployments --json`.
- `npm run typecheck`, `npm run build`, `npm run build:gas`, `npx clasp run healthCheck`, and `npx clasp run getDbInfo` passed.
- This release removes internal mode labels from member-facing pages, makes unpaid annual-fee status more explicit, and adds configurable payment guidance via `T_システム設定.ANNUAL_FEE_PAYMENT_GUIDANCE`.

### 2026-04-07 `v173`

- Version `173` created with `npx clasp version "v173 gray out business office fields for non-representatives and move member status and joined date to admin-only display"`.
- Both fixed deployments synced to `@173`.
- Verified with `npx clasp deployments --json`.
- `npm run typecheck`, `npm run build`, `npm run build:gas`, `npx clasp run healthCheck`, and `npx clasp run getDbInfo` passed.
- This release makes business-office fields representative-only, moves business-member status and joined date into admin-only display blocks, and removes the developer-facing helper text under office name.
## 2026-04-15 hcm-n.org redeploy note
- Fixed deployment IDs remain unchanged:
  - member: `AKfycbywpWoYxij6A-ZunIeBjG1Q8qX78PMMTsT3frx1cM5PJ2nAuZpz81KruXb5LIvWgbQx`
  - public: `AKfycbxyuUXgK1oHUDMahQjluiL-gcrMK0qV0FWLFYaYBqGxlRSg9NhvmbyQRyf0dvaqg7Zp`
- On 2026-04-15 both fixed deployments were redeployed again to `versionNumber: 208` by `k.noguchi@hcm-n.org`.
- For a newly switched domain account, `clasp redeploy` may fail with `User has not enabled the Apps Script API`.
  In that case, enable `Google Apps Script API` at `https://script.google.com/home/usersettings` for the operational Google user, then rerun `npx clasp redeploy`.

## 2026-04-16 v215 deployment note
- Admin member-management changes for business staff add/save UX were released as `v215`.
- Both fixed deployments were synced to `@215`.
- Verification completed with `npx clasp deployments --json`, `npx clasp run healthCheck`, and `npx clasp run getDbInfo`.
- Keep the standard release order: `build -> push -> version -> fixed deployment sync -> verification -> document update`.
