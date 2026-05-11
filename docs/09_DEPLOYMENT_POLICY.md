# Deployment Policy

Updated: 2026-05-11
Production: `v333` / integrated-public fixed deployments `@297` x2 / member split `@53` / admin split `@91`

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
| Legacy member portal deployment | `AKfycbywpWoYxij6A-ZunIeBjG1Q8qX78PMMTsT3frx1cM5PJ2nAuZpz81KruXb5LIvWgbQx` | `@297` (`v333`) |
| Public portal | `AKfycbxyuUXgK1oHUDMahQjluiL-gcrMK0qV0FWLFYaYBqGxlRSg9NhvmbyQRyf0dvaqg7Zp` | `@297` (`v333`) |

### Split projects

| Purpose | Script ID | Deployment ID | Current version | Access |
|---|---|---|---|---|
| member | `1ZKFJKNr4IzbguZvO4KbtSOE1BzkrzOG8OV2tF0RFdk28EnZTCL4Sx3dJ` | `AKfycbxd_6HlH5aWLhxYOtLUHehI3ODiHg4fpc5SCzNdEBIDbDpaBuU3KTuqDRbeBmhWZxSQ_g` | `@53` (`v333`) | `ANYONE_ANONYMOUS` |
| admin | `1tlBJ-OJjqNQQxzb5tY3iRUlS4DmQD9sYqw5j842tXD1SPVHutBUeKTRi` | `AKfycbwSCTTyvWY_cFG764XawdbqA8r0qxYbav4aDZ-BK9rRmvXHoUXrKQnQ9egRGqWcx4Os` | `@91` (`v333`) | `DOMAIN` |

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

### 2026-05-12 `v333` ← current production
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
