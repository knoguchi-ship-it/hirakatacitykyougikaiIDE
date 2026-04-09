# Next Instructions For ClaudeCode



Updated: 2026-04-06

Production: `v171` / fixed deployments `@171`



## 1. Current State You Need To Know

- Production is `v171`.

- Both fixed deployments point to `@171`.

- Demo login accounts, mock member routes, and the in-app demo selector are retired.

- The member portal uses sidebar logout.

- Business-member UI is organized around representative info, office info, and fixed delivery rules.

- Individual/support members treat blank `officeName` or `????` as no office affiliation.



## 2. Read First

1. `HANDOVER.md`

2. `AGENTS.md`

3. `GLOBAL_GROUND_RULES/docs/AI_RULES/05_PROJECT_RULES_HIRAKATA.md`

4. `docs/44_DEVELOPMENT_HANDOVER_PLAYBOOK_2026-04-04.md`

5. `docs/46_RELEASE_STATE_v171_2026-04-06.md`

6. `docs/09_DEPLOYMENT_POLICY.md`

7. `docs/05_AUTH_AND_ROLE_SPEC.md`

8. `docs/04_DB_OPERATION_RUNBOOK.md`

9. `docs/03_DATA_MODEL.md`



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

- both fixed deployments point to `@171`



## 4. Working Rules

- Use a document-driven workflow.

- Follow `docs/44_DEVELOPMENT_HANDOVER_PLAYBOOK_2026-04-04.md` for start checks, completion criteria, and handover updates.

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

- v171 deployed. Both fixed deployments confirmed at `@171`.

- Business member representative info is editable only by the `REPRESENTATIVE`本人. `ADMIN` is read-only for that section.

- In the member portal, business-member `status` and `joinedDate` are display-only. If status is `WITHDRAWAL_SCHEDULED`, show the scheduled withdrawal date.

- v167 tests all PASS — see `docs/41_TEST_SPEC_v167_BUSINESS_ADMIN_ROLE_CHANGE.md`.

- **DB STATUS (2026-04-04)**: The same-day recovery attempt was rolled back by the user. Treat the current production DB as the reconciled baseline.

- If you perform any DB-changing operation, record the backup point, rollback path, and post-change verification in the same turn.

- Admin console FY filter default is `全期間`, and year-specific counts must use status at the selected fiscal-year timepoint rather than current withdrawn state.
