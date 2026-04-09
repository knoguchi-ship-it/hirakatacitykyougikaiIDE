# Deployment Policy

Updated: 2026-04-09
Production: `v187` / fixed deployments `@187`

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

Both fixed deployments currently point to `@187`.

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
