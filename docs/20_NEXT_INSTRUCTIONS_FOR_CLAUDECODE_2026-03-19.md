# Next Instructions For ClaudeCode



Updated: 2026-04-04

Production: `v168` / fixed deployments `@168` (v169 pushed, deployments not yet updated)



## 1. Current State You Need To Know

- Production is `v168`.

- Both fixed deployments point to `@168`.

- Demo login accounts, mock member routes, and the in-app demo selector are retired.

- The member portal uses sidebar logout.

- Business-member UI is organized around representative info, office info, and fixed delivery rules.

- Individual/support members treat blank `officeName` or `????` as no office affiliation.



## 2. Read First

1. `HANDOVER.md`

2. `GLOBAL_GROUND_RULES/CLAUDE.md`

3. `GLOBAL_GROUND_RULES/docs/AI_RULES/05_PROJECT_RULES_HIRAKATA.md`

4. `docs/09_DEPLOYMENT_POLICY.md`

5. `docs/05_AUTH_AND_ROLE_SPEC.md`

6. `docs/04_DB_OPERATION_RUNBOOK.md`

7. `docs/03_DATA_MODEL.md`



## 3. First Commands

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

- health checks succeed

- both fixed deployments point to `@168`



## 4. Working Rules

- Use a document-driven workflow.

- Verify the current source docs before changing behavior.

- Do not bring back demo or mock flows.

- Treat `staff.role='REPRESENTATIVE'` as the canonical source for business representative info.

- Do not add member-editable delivery settings for business members.



## 5. Minimum Checks After Changes

```bash

npm run typecheck

npm run build

npm run build:gas

cd backend

npx clasp run healthCheck

npx clasp run getDbInfo

```



If you deploy, also follow `docs/09_DEPLOYMENT_POLICY.md` for:

- `npx clasp push --force`

- `npx clasp version "..."`

- fixed deployment sync

- `npx clasp deployments --json`

- browser verification when needed

- source document updates



## 6. Notes

- The worktree contains unrelated existing diffs. Do not revert them.

- If a source document becomes corrupted, fix it immediately.

- `docs/learning/` is reference material only.


## 7. Next Required Action

- v168 deployed. Both fixed deployments confirmed at `@168`.

- v167 tests all PASS — see `docs/41_TEST_SPEC_v167_BUSINESS_ADMIN_ROLE_CHANGE.md`.

- **DB RESTORED (2026-04-04)**: Production data restored from 2026-03-26 external backup. WL-001 repaired. Demo accounts added (DEMO-IND-001, DEMO-IND-002, DEMO-BIZ-001). See `HANDOVER.md` §7 for details.

- **KNOWN ISSUE**: T_事業所職員 has pre-existing data quality issues (corrupted name/role columns for some staff). Admin login and member list work. If needed, restore from Google Spreadsheet version history for a cleaner state.

- **PENDING**: User decision on admin console FY filter default — see `docs/42_SPEC_AUDIT_ADMIN_CONSOLE_2026-04-04.md` §3.
