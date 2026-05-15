# Deployment Policy

Updated: 2026-05-15
Production: `v353` (member の「受付中の研修」UI 改修) / integrated-public fixed deployments `@311` x2 / member split `@68` / admin split `@108` (v350 のまま)

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
| Legacy member portal deployment | `AKfycbywpWoYxij6A-ZunIeBjG1Q8qX78PMMTsT3frx1cM5PJ2nAuZpz81KruXb5LIvWgbQx` | `@311` (`v352`) |
| Public portal | `AKfycbxyuUXgK1oHUDMahQjluiL-gcrMK0qV0FWLFYaYBqGxlRSg9NhvmbyQRyf0dvaqg7Zp` | `@311` (`v352`) |

### Split projects

| Purpose | Script ID | Deployment ID | Current version | Access |
|---|---|---|---|---|
| member | `1ZKFJKNr4IzbguZvO4KbtSOE1BzkrzOG8OV2tF0RFdk28EnZTCL4Sx3dJ` | `AKfycbxd_6HlH5aWLhxYOtLUHehI3ODiHg4fpc5SCzNdEBIDbDpaBuU3KTuqDRbeBmhWZxSQ_g` | `@68` (`v353`) | `ANYONE_ANONYMOUS` |
| admin | `1tlBJ-OJjqNQQxzb5tY3iRUlS4DmQD9sYqw5j842tXD1SPVHutBUeKTRi` | `AKfycbwSCTTyvWY_cFG764XawdbqA8r0qxYbav4aDZ-BK9rRmvXHoUXrKQnQ9egRGqWcx4Os` | `@108` (`v350`, rolled back from `@109` v351) | `DOMAIN` |

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

### 2026-05-15 `v353` ← current production
- Scope: 会員マイページの「受付中の研修」(`src/components/TrainingApply.tsx`) を v352 と同じ A4 縦サムネイル + 詳細情報 2 カラムカードへ改修。v352 では誤って public portal を改修していた認識違いを修正。member split のみ更新。
- Integrated fixed deployments: `@311` x2 (unchanged, v352)
- Member split: `@68`
- Admin split: `@108` (unchanged, v350)
- Detail: `docs/220_RELEASE_STATE_v353_2026-05-15.md`

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

### 2026-05-14 `v350` ← current production

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
- Detail: `docs/210_RELEASE_STATE_v341_2026-05-13.md`

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
- Detail: `docs/199_RELEASE_STATE_v320_to_v332_2026-05-11.md`

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
