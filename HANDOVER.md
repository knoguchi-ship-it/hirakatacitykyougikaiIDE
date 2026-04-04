# Handover



Updated: 2026-04-03

Production: `v168` / fixed deployments `@168`

Project: Hirakata care manager association member system



## 1. Read First

1. `HANDOVER.md`

2. `GLOBAL_GROUND_RULES/CLAUDE.md`

3. `GLOBAL_GROUND_RULES/docs/AI_RULES/05_PROJECT_RULES_HIRAKATA.md`

4. `docs/20_NEXT_INSTRUCTIONS_FOR_CLAUDECODE_2026-03-19.md`

5. `docs/09_DEPLOYMENT_POLICY.md`

6. `docs/05_AUTH_AND_ROLE_SPEC.md`

7. `docs/04_DB_OPERATION_RUNBOOK.md`

8. `docs/03_DATA_MODEL.md`



## 2. Current Production State

- Branch: `main`

- GAS version: `168`

- Fixed deployments:

  - Member portal: `AKfycbywpWoYxij6A-ZunIeBjG1Q8qX78PMMTsT3frx1cM5PJ2nAuZpz81KruXb5LIvWgbQx` -> `@168`

  - Public portal: `AKfycbxyuUXgK1oHUDMahQjluiL-gcrMK0qV0FWLFYaYBqGxlRSg9NhvmbyQRyf0dvaqg7Zp` -> `@168`

- DB schema version: `2026-03-26-03`

- Verified commands:

  - `npm run typecheck`

  - `npm run build`

  - `npm run build:gas`

  - `npx clasp run healthCheck`

  - `npx clasp run getDbInfo`

- Deployment confirmation was done with `npx clasp deployments --json` plus GAS health checks.



## 3. Current Functional State

### Login

- Member login uses `loginId + password`.

- Admin login uses Google account plus whitelist verification.

- Demo login accounts and mock member routes were removed in `v166`.



### Member portal UI

- The top-right floating `logged in / logout` widget is gone.

- Logout is integrated into the left sidebar.

- Admin-only fields are not kept visible as disabled controls in member-facing screens.

- `loginId` is shown only in the `login and password` section, not duplicated in the summary area.



### Individual and support members

- If `officeName` is blank or `????`, the system treats the member as having no office affiliation.

- In that case office fields are cleared on save and `preferredMailDestination='OFFICE'` is normalized to `HOME`.



### Business members

- `Representative info` is derived from the `REPRESENTATIVE` staff row.

- `Office info` is canonical and `officeNumber` is required.

- `Delivery / notification rules` are display-only fixed business rules.

- `STAFF` users remain mostly read-only.



## 4. Recent Releases

### v168 (built 2026-04-03, deployed 2026-04-03)

- Emergency fix: `backend/Code.gs` was truncated during v167 editing (38 functions including `processApiRequest` were silently removed).

- Restored `Code.gs` from git commit `a384bec` and re-applied the two v167 changes cleanly.

- Both fixed deployments updated to `@168`. App verified operational.



### v167 (built 2026-04-03, superseded by v168)

- Implemented business `ADMIN` role-change rules (see `docs/40_HANDOVER_TASK_BUSINESS_ADMIN_ROLE_CHANGE_RULE.md`).

- `ADMIN` can now change roles of other staff (ADMIN↔STAFF) via the member portal.

- `ADMIN` cannot change the `REPRESENTATIVE` row, their own role, or assign `REPRESENTATIVE`.

- Fixed pre-existing bug: `updateMemberSelf_` was missing step 1 (`ss`/`authRow` init), causing all member self-save calls to fail.

- UI: `canEditThisRole` per-row logic in staff list; updated disabled state and hint messages.

- Backend: self-role guard added in `updateMemberSelf_`; `STAFF_WRITABLE_FIELDS_ADMIN_` updated.



### v166

- Removed special demo member login paths.

- Removed demo member portal return paths.

- Aligned business member profile UI around representative info, office info, and fixed delivery rules.

- Synced both fixed deployments to `@166`.



### v165

- Fixed member self-save path for office fields.

- Added no-office normalization for individual and support members.

- Hid the save button for read-only business staff users.



### v160

- Removed the demo selector UI.

- Moved logout into the left sidebar account area.



## 5. Resume Checklist

```bash

git status --short

cd backend

npx clasp show-authorized-user

npx clasp run healthCheck

npx clasp run getDbInfo

npx clasp deployments --json

```



Expected:

- authorized user is the production operator account

- both fixed deployments point to `@168`

- do not revert unrelated local changes



## 6. Notes

- The worktree still contains unrelated existing diffs. Do not revert them unless explicitly asked.

- `docs/learning/` contains reference material only, not source-of-truth specs.

- `seedDemoData()` and other mock/demo runtime paths must not be reintroduced.

- **CRITICAL**: `seedDemoData` was executed on 2026-04-03 against the production spreadsheet during Playwright UI testing. Production DB tables (T_会員, T_事業所職員, T_認証アカウント, T_管理者Googleホワイトリスト, etc.) were wiped and replaced with demo data. Data recovery requires restoring from Google Spreadsheet version history.



## 7. Next Required Action

- v168 deployed and verified. All v167 tests (T-UI-01 through T-UI-05, T-BE-01, T-BE-02) PASS — see `docs/41_TEST_SPEC_v167_BUSINESS_ADMIN_ROLE_CHANGE.md`.

- **CRITICAL OPEN**: Restore production data from spreadsheet version history (before 2026-04-03). See `docs/42_SPEC_AUDIT_ADMIN_CONSOLE_2026-04-04.md` for full audit report.

- **PENDING USER DECISION**: Admin console FY filter default (`'ALL'` vs current FY) — see `docs/42_SPEC_AUDIT_ADMIN_CONSOLE_2026-04-04.md` §3.
