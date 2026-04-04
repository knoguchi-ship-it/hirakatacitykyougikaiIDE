# 05_PROJECT_RULES_HIRAKATA

## Purpose
This file defines project-specific ground rules for the Hirakata care manager association system.
When a local project rule is needed, treat this file as the project-level source of truth.

## Read First
1. `HANDOVER.md`
2. `GLOBAL_GROUND_RULES/CLAUDE.md`
3. `GLOBAL_GROUND_RULES/docs/AI_RULES/05_PROJECT_RULES_HIRAKATA.md`
4. `docs/20_NEXT_INSTRUCTIONS_FOR_CLAUDECODE_2026-03-19.md`
5. `docs/09_DEPLOYMENT_POLICY.md`
6. `docs/10_SOW.md`
7. `docs/17_ROOT_CAUSE_ERROR_RESPONSE_PLAYBOOK.md`
8. `docs/05_AUTH_AND_ROLE_SPEC.md`
9. `docs/04_DB_OPERATION_RUNBOOK.md`
10. `docs/03_DATA_MODEL.md`

## Project Rules
- Before making technical, legal, compliance, or operational recommendations, verify the latest primary sources on the web.
- Base proposals on both external primary sources and the current project docs.
- If external best practice conflicts with current project rules, follow the project rules first and record the difference.
- When code, deployment, data, or UI changes, update the relevant source documents in the same turn.
- If you find mojibake, version drift, or stale instructions, fix them before calling the work complete.

## Project Sources Of Truth
- `HANDOVER.md`
- `docs/20_NEXT_INSTRUCTIONS_FOR_CLAUDECODE_2026-03-19.md`
- `docs/10_SOW.md`
- `docs/09_DEPLOYMENT_POLICY.md`
- `docs/17_ROOT_CAUSE_ERROR_RESPONSE_PLAYBOOK.md`
- `docs/05_AUTH_AND_ROLE_SPEC.md`
- `docs/04_DB_OPERATION_RUNBOOK.md`
- `docs/03_DATA_MODEL.md`

## Runtime Rules
- Authentication, authorization, DB integrity, and deployment validation must be checked on the Apps Script runtime, not with static mocks.
- Member login is `loginId + password` only.
- Admin login is Google account plus whitelist verification.
- Production URLs are managed by two fixed deployments. Follow `docs/09_DEPLOYMENT_POLICY.md`.
- A release is complete only after `build -> push -> version -> fixed deployment sync -> verification -> document update`.

## Current Operating Assumptions
- Production is `v170` and both fixed deployments are at `@170`.
- Demo login flows, mock member routes, and the on-screen demo selector are retired.
- For business members, `representative info` is derived from `staff.role='REPRESENTATIVE'`.
- For business members, `office info` is canonical and `officeNumber` is required.
- For business members, delivery and notification behavior is fixed-rule display only.
- Business `ADMIN` may change STAFF<->ADMIN roles for others, but not own role, REPRESENTATIVE row, or assign REPRESENTATIVE (v167).
- `seedDemoData` is a DESTRUCTIVE operation that wipes all production DB tables. Never run against the production spreadsheet without a full backup.
- The production DB baseline was rolled back and reconciled on 2026-04-04. Treat that post-rollback state as canonical unless a newer documented DB operation supersedes it.

## Minimum Resume Checks
```bash
git status --short
cd backend
npx clasp show-authorized-user
npx clasp run healthCheck
npx clasp run getDbInfo
```
