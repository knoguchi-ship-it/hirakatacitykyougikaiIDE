# Member Status Note

Date: 2026-05-12
Status: deployed in production as v340

## Scope

- Added admin-only `T_会員.ステータスメモ`.
- Added a `ステータスメモ（管理者のみ）` textarea to the admin member detail status section.
- Saves `statusNote` through the admin member update API only.
- Limits the note to 2,000 characters.
- Does not expose the value to the member portal or public portal.

## Data Model

- `ステータスメモ` is appended to the end of `T_会員`.
- The column is intentionally appended, not inserted into the middle of the table, to avoid shifting existing data columns.
- Schema initialization was adjusted so existing table headers are not overwritten before `normalizeTableColumns_` runs. Existing tables now go through name-based migration first; only missing tables receive fresh headers through `ensureTableSheetsExist_`.
- `DB_SCHEMA_VERSION` is bumped to `2026-05-12-member-status-note-v1` so production initialization does not skip the new column.

## Implementation Notes

- `MEMBER_WRITABLE_FIELDS_` does not include `statusNote`.
- `mapMembersForApi_` includes `statusNote` only when called with `{ includeAdminStatusNote: true }`.
- `getMemberPortalData_` does not pass that option, so member portal responses do not include the note.
- Admin audit logging records changes to `ステータスメモ`.

## Verification

- `npx clasp deployments --json` (integrated/public): PASS, fixed deployments `@301` x2
- `npx clasp deployments --json` (member split): PASS, fixed deployment `@57`
- `npx clasp deployments --json` (admin split): PASS, fixed deployment `@98`
- `npm run prerelease`: PASS
- `npm run typecheck`: PASS
- `npm run build:gas:admin`: PASS
- `npm run build:gas`: PASS
- `npm run build:gas:member`: PASS
- `npm run security:admin-boundary`: PASS
- `npm run security:public-boundary`: PASS
- `npm run security:split-boundary`: PASS

## Deployment Notes

Deployed on 2026-05-12 as v340:

- Integrated/public Apps Script version: `301`
- Member split Apps Script version: `57`
- Admin split Apps Script version: `98`
- Fixed deployment description: `v340 status note schema fix`

Post-deployment operator browser checks:

1. Admin portal -> member detail -> status section shows the memo field.
2. Saving a memo persists after reload.
3. Member portal does not show the memo.
4. Existing status/date updates still save correctly.
