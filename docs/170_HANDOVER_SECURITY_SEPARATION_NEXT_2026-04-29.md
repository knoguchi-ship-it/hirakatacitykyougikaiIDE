# Handover: Security Separation Next Steps

作成日: 2026-04-29
対象本番: `v290`

## 1. Purpose

次開発者が、public / member / admin の 3 境界を崩さずに開発を再開できるよう、現在の分離状況、完了済み事項、未完了タスク、禁止事項を整理する。

この文書は作業再開時の補助資料であり、現行値の正本は `HANDOVER.md` と `docs/09_DEPLOYMENT_POLICY.md` とする。

## 2. Current Production State

| Area | Current |
|---|---|
| Production version | `v290` |
| Integrated/public GAS version | `@289` |
| Member split GAS version | `@39` |
| Admin split GAS version | `@46` |
| Public deployment | `AKfycbxyuUXgK1oHUDMahQjluiL-gcrMK0qV0FWLFYaYBqGxlRSg9NhvmbyQRyf0dvaqg7Zp` |
| Integrated legacy deployment | `AKfycbywpWoYxij6A-ZunIeBjG1Q8qX78PMMTsT3frx1cM5PJ2nAuZpz81KruXb5LIvWgbQx` |
| Member split deployment | `AKfycbxd_6HlH5aWLhxYOtLUHehI3ODiHg4fpc5SCzNdEBIDbDpaBuU3KTuqDRbeBmhWZxSQ_g` |
| Admin split deployment | `AKfycbwSCTTyvWY_cFG764XawdbqA8r0qxYbav4aDZ-BK9rRmvXHoUXrKQnQ9egRGqWcx4Os` |

## 3. Separation Status

### Public / integrated project

Status: **mostly separated at artifact/runtime entrypoint level**.

Completed:

- Existing public URL and deployment ID were preserved.
- `backend/Code.gs` is now generated public-only artifact.
- Full source is kept at `gas-src/Code.full.gs`.
- `backend/index.html` and `backend/index_admin.html` are not pushed to the public project.
- `doGet` routes to `index_public`.
- Public top-level callable functions are limited to:
  - `doGet`
  - `healthCheck`
  - `processApiRequest`
- `rebuildDatabaseSchema` and `getDbInfo` are not public-callable.
- Browser negative check confirmed:
  - `google.script.run.rebuildDatabaseSchema()` -> `is not a function`
  - `google.script.run.getDbInfo()` -> `is not a function`
- Admin/member action handlers are removed from public `processApiRequest`.
- Admin cache / admin audit / admin role transition private helpers were removed from public artifact in `v290`.
- `npm run security:public-boundary` checks public callable/action/HTML boundary before release.

Remaining concerns:

- The public artifact still uses shared public workflows that legitimately touch member-related tables for public applications, public change requests, public withdrawal, and public business staff operations. This is expected public workflow behavior, not member portal login separation.
- `backend/appsscript.json` still has broad scopes required by current public workflows: Sheets, Mail, Drive, external request. Scope minimization is not complete.
- The integrated project remains the public runtime because the public deployment ID cannot be moved to another Apps Script project without changing URL. This is accepted by the current URL-preservation requirement.

### Member split

Status: **deployed and operationally separated, but physical pruning approach is limited**.

Completed:

- Member split project is deployed at `@39`.
- Member login remains `loginId + password`.
- Admin login UI must not be restored to member portal.
- Member split build removes boundary-external action handlers and registries.

Remaining concerns:

- Broad function-body pruning for split projects is not generally safe yet. v283 caused a function dependency regression and was rolled back in v284.
- Any future member physical pruning must protect wrapper / alias / reassignment / trigger / direct Apps Script execution dependencies.

### Admin split

Status: **rolled back to stable deployment; further physical pruning is not complete**.

Completed:

- Admin split remains on rollback-stable `@46`.
- Admin login remains Google account + whitelist.
- Admin project access is `DOMAIN`.

Remaining concerns:

- Admin physical pruning attempt `@47` caused whiteout and must not be redeployed until root cause is isolated.
- Admin split still needs a safe pruning redesign if further physical separation is required.
- Initial display dependencies such as `doGet`, compressed HTML bootstrap, `adminLoginWithData`, `getAdminInitData`, and required helpers must be protected before retrying.

## 4. Must-Read Files

Read in this order before making changes:

1. `HANDOVER.md`
2. `AGENTS.md`
3. `docs/169_RELEASE_STATE_v290_2026-04-29.md`
4. `docs/168_RELEASE_STATE_v289_2026-04-29.md`
5. `docs/167_THIRD_PARTY_ASSESSMENT_PUBLIC_SEPARATION_2026-04-28.md`
6. `docs/165_HANDOVER_PUBLIC_PORTAL_SEPARATION_PLAN_2026-04-28.md`
7. `docs/09_DEPLOYMENT_POLICY.md`
8. `docs/05_AUTH_AND_ROLE_SPEC.md`
9. `docs/04_DB_OPERATION_RUNBOOK.md`
10. `docs/03_DATA_MODEL.md`

## 5. Guardrails

Do not:

- Do not propose merging public/member/admin boundaries.
- Do not restore demo login, mock member route, or in-screen demo selector.
- Do not restore admin login UI to member portal.
- Do not make public URL changes as a shortcut.
- Do not redeploy admin physical pruning `@47`.
- Do not use Apps Script UI manual deployment edits as the normal production path.
- Do not call `seedDemoData` in production.
- Do not update only one of the two integrated/public fixed deployments.

Always:

- Run `git status --short` and `git diff` before any push.
- Classify all untracked files.
- Run `npm run security:public-boundary` before release.
- Run `npm run prerelease` before production deploy.
- For production integrated/public release, use:

```bash
npx clasp push --force
npx clasp version "<release note>"
npx clasp redeploy AKfycbywpWoYxij6A-ZunIeBjG1Q8qX78PMMTsT3frx1cM5PJ2nAuZpz81KruXb5LIvWgbQx --versionNumber <n> --description "<release note>"
npx clasp redeploy AKfycbxyuUXgK1oHUDMahQjluiL-gcrMK0qV0FWLFYaYBqGxlRSg9NhvmbyQRyf0dvaqg7Zp --versionNumber <n> --description "<release note>"
npx clasp deployments --json
```

## 6. Remaining Tasks

### Task A: Public OAuth scope minimization

Goal: Reduce blast radius of public anonymous web app.

Current state:

- Public web app still uses broad scopes in `backend/appsscript.json`.
- Some public workflows genuinely require Sheets, Mail, and Drive access.

Recommended approach:

1. Inventory each public action and required Apps Script service.
2. Determine whether `drive` can be replaced or isolated for thumbnail/file flows.
3. If scope changes are possible, release as a small public-only version.
4. Verify public workflows that use files, email, and spreadsheet writes.

Do not remove scopes blindly; missing scopes can break production flows.

### Task B: Admin physical pruning redesign

Goal: Make admin artifact physically smaller without whiteout.

Current state:

- Admin `@47` whiteout occurred.
- Admin is stable at `@46`.

Recommended approach:

1. Diff generated `@47`-equivalent admin artifact against stable `@46`.
2. Identify first-paint dependencies and bootstrap dependencies.
3. Add explicit admin seed allowlist for initial display.
4. Build locally, perform syntax check and boundary audit.
5. Deploy only after operator browser check plan is ready.

### Task C: Member split physical pruning hardening

Goal: Continue member separation without repeating v283 dependency regression.

Current state:

- Member `@39` remains deployed.
- Physical pruning can break alias / wrapper / reassignment patterns.

Recommended approach:

1. Improve dependency analyzer or move to AST-based generation.
2. Add member-specific boundary audit similar to `security:public-boundary`.
3. Validate member login, training list, applied training, member update, password change, apply/cancel, withdrawal flows.

### Task D: Source ownership cleanup

Goal: Make source/artifact ownership obvious and harder to misuse.

Current state:

- `gas-src/Code.full.gs` is canonical full source.
- `backend/Code.gs` is generated public artifact.
- `gas/member/Code.gs` and `gas/admin/Code.gs` are generated split artifacts.

Recommended approach:

1. Add generated-file headers to all generated `Code.gs` artifacts.
2. Consider making build scripts fail if generated artifact is hand-edited without updating source.
3. Document generated-file ownership in `docs/02_ARCHITECTURE.md` and `docs/09_DEPLOYMENT_POLICY.md`.

## 7. Current Completion Definition

Current public separation is acceptable for runtime exposure:

- Public URL remains stable.
- Public callable functions are limited.
- Public action handlers are limited.
- Browser-side negative checks passed for removed maintenance entrypoints.

Full security separation is **not fully complete** until:

- Public OAuth scopes are reviewed and minimized where possible.
- Admin physical pruning has a safe redesign and no longer depends on rollback `@46` as the long-term state.
- Member/admin split artifacts have boundary audits comparable to public.
- Generated artifact ownership is enforced mechanically.

## 8. Verification Snapshot

Last verified in v290:

- `npm run build:gas`: PASS
- `npm run prerelease`: PASS
- `npm run security:public-boundary`: PASS
- `npx clasp deployments --json`: integrated/public `@289`, member `@39`, admin `@46`
- `npx clasp run healthCheck`: PASS
- `npx clasp run getDbInfo`: `Script function not found`
- headless Chrome / CDP: removed public maintenance functions are not callable

