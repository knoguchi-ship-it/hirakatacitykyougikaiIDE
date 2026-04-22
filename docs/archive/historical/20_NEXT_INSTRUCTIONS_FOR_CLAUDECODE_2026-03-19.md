# Next Instructions For ClaudeCode

Updated: 2026-04-15

Production: `v208` / fixed deployments `@208`

> **Note**: This document supplements `HANDOVER.md`. `HANDOVER.md` is the primary source of truth.
> Always read `HANDOVER.md` first.

## 1. Current State

- Production is `v208`. Both fixed deployments point to `@208`.
- Frontend HTML compressed: member ~206 kB / public ~150 kB (deflate-raw + base64, `scripts/compress-html.mjs`).
- Admin login uses `checkAdminBySession` (auth only). Member data is loaded lazily on page navigation.
- Admin whitelist and auth rows are cached in `CacheService.getScriptCache()` (TTL 300s) for faster warm-instance logins.
- Demo login accounts, mock member routes, and the in-app demo selector are retired.
- The member portal uses sidebar logout.
- Business-member UI is organized around representative info, office info, and fixed delivery rules.
- Individual/support members treat blank `officeName` or `????` as no office affiliation.
- Demo accounts (production DB): `demo-ind-001` / `demo1234` (individual), `demo-ind-002` / `demo1234` (individual).
- Roster export console (`RosterExport`): requires `ROSTER_TEMPLATE_SS_ID` in system settings.
  - Template resolution: prefers `_DATA_ROSTER` sheet, falls back to legacy `_DATA`.
  - Sheet selection: prefers developer metadata (`HKC_TEMPLATE_FAMILY`), falls back to `P_` / `B_` prefix.
  - Reminder template (`REMINDER_TEMPLATE_SS_ID`) is supported in the same spreadsheet.
  - Template validation available in system settings before save.
- Bulk mail console (`BulkMailSender`): requires `BULK_MAIL_AUTO_ATTACH_FOLDER_ID` for Drive auto-attach.
- Email log viewer role: controlled by `EMAIL_LOG_VIEWER_ROLE` system setting (default: `MASTER`).
- SOW (Phase 1–3) is fully complete as of v196. No new SOW scope is active.

## 2. Read First

1. `HANDOVER.md`
2. `AGENTS.md`
3. `GLOBAL_GROUND_RULES/docs/AI_RULES/05_PROJECT_RULES_HIRAKATA.md`
4. `docs/44_DEVELOPMENT_HANDOVER_PLAYBOOK_2026-04-04.md`
5. `docs/archive/release_history/78_RELEASE_STATE_v208_2026-04-15.md`
6. `docs/09_DEPLOYMENT_POLICY.md`
7. `docs/05_AUTH_AND_ROLE_SPEC.md`
8. `docs/04_DB_OPERATION_RUNBOOK.md`
9. `docs/03_DATA_MODEL.md`

## 3. First Commands

```bash
git status --short
npx clasp show-authorized-user
npx clasp run healthCheck
npx clasp run getDbInfo
npx clasp deployments --json
```

Expected:
- authorized user is `k.noguchi@uguisunosato.or.jp`
- health checks succeed
- both fixed deployments point to `@208`
- DB ID `1GVlIzOG1Tsqw8fBXgZ__c8u4oMu-4_WCf0H3aVLESKs`

## 4. Working Rules

- Use a document-driven workflow.
- Follow `docs/44_DEVELOPMENT_HANDOVER_PLAYBOOK_2026-04-04.md` for start checks, completion criteria, and handover updates.
- Verify the current source docs before changing behavior.
- Do not bring back demo or mock flows.
- Treat `staff.role='REPRESENTATIVE'` as the canonical source for business representative info.
- Do not add member-editable delivery settings for business members.
- `seedDemoData` destroys production DB — never run without full backup and explicit approval.

## 5. Minimum Checks After Changes

```bash
npm run typecheck
npm run build:gas
npx clasp run healthCheck
npx clasp run getDbInfo
```

If you deploy, follow `docs/09_DEPLOYMENT_POLICY.md`:
- `npx clasp push --force`
- `npx clasp version "..."`
- `npx clasp redeploy AKfycbywpWoYxij6A-ZunIeBjG1Q8qX78PMMTsT3frx1cM5PJ2nAuZpz81KruXb5LIvWgbQx --versionNumber <n> --description "..."`
- `npx clasp redeploy AKfycbxyuUXgK1oHUDMahQjluiL-gcrMK0qV0FWLFYaYBqGxlRSg9NhvmbyQRyf0dvaqg7Zp --versionNumber <n> --description "..."`
- `npx clasp deployments --json`
- browser verification when the change affects user flows
- source document updates (`HANDOVER.md`, `docs/09_DEPLOYMENT_POLICY.md`, release state doc)

## 6. Notes

- `clasp deploy` (all forms) is prohibited — it creates a new deployment ID and changes the URL.
- Releasing requires `clasp push` → `clasp version` → `clasp redeploy` (not Apps Script UI by default).
- If a source document becomes corrupted, fix it immediately.
- `docs/learning/` is reference material only.
- Screenshot / evidence PNG files are in `.gitignore` — do not commit them.

## 7. Remaining Work

- **B-02**: `fetchAllDataFromDbFresh_()` batch optimization — reduce Spreadsheet API calls. See `docs/58_NEXT_TASK_PERFORMANCE_2026-04-09.md`.
- **GEMINI_API_KEY**: Set in Script Properties if AI email feature is needed.
- **Roster template setup**: Register `ROSTER_TEMPLATE_SS_ID` in system settings before using the export console. Sample template at `11n5T7HZm7fu8Gau7nR57NWBVxpiCqZttg0Yca5t5-T4`.
- **Mailing list export**: Browser verification of v207 feature (address display, download behavior).
