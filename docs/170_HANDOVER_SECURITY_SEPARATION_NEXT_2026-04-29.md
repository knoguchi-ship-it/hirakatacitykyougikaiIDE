# Handover: Security Separation Next Steps

作成日: 2026-04-29
対象本番: `v291`

## 1. Purpose

次開発者が、public / member / admin の 3 境界を崩さずに開発を再開できるよう、現在の分離状況、完了済み事項、未完了タスク、禁止事項を整理する。

この文書は作業再開時の補助資料であり、現行値の正本は `HANDOVER.md` と `docs/09_DEPLOYMENT_POLICY.md` とする。

## 2. Current Production State

| Area | Current |
|---|---|
| Production version | `v291` |
| Integrated/public GAS version | `@290` |
| Member split GAS version | `@40` |
| Admin split GAS version | `@49` （v292 pruning バグ修正）|
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

- Member split project is deployed at `@40`.
- Member login remains `loginId + password`.
- Admin login UI must not be restored to member portal.
- Member split build removes boundary-external action handlers and registries.
- `v291`: `scripts/build-member-gas.mjs` removes maintenance top-level callables from the generated member artifact and asserts member top-level callables are only `doGet` and `processApiRequest`.
- `v291`: `npm run security:member-boundary` verifies member top-level callables, member action handlers, empty public/admin registries, and server-side `sessionToken` principal binding.

Remaining concerns:

- Broad function-body pruning for split projects is not generally safe yet. v283 caused a function dependency regression and was rolled back in v284.
- Any future member physical pruning must protect wrapper / alias / reassignment / trigger / direct Apps Script execution dependencies.
- Broad function-body pruning beyond the protected build-time pruning remains deferred.

### Admin split

Status: **rolled back to stable deployment; further physical pruning is not complete**.

Completed:

- Admin split is deployed at `@49` （v292: pruning バグ修正）。
- Admin login remains Google account + whitelist.
- Admin project access is `DOMAIN`.
- `v291`: `scripts/build-admin-gas.mjs` removes maintenance/destructive top-level callables from the generated admin artifact and asserts admin top-level callables are only `doGet` and `processApiRequest`.
- `v291`: `npm run security:admin-boundary` verifies admin top-level callables, admin action handlers, empty public/member registries, and `checkAdminBySession_` enforcement for permissioned actions.
- `v291`: mailing-list export admin workflow adds `getMailingListTargets` and extends `generateMailingListExcel` with server-side `targetKeys` revalidation. This is an admin-only action and must remain outside public/member action registries.

Remaining concerns:

- Admin physical pruning attempt `@47` caused whiteout and must not be redeployed until root cause is isolated.
- Admin split still needs a safe pruning redesign if broader physical separation is required.
- Initial display dependencies such as `doGet`, compressed HTML bootstrap, `adminLoginWithData`, `getAdminInitData`, and required helpers must be protected before retrying.

## 4. Must-Read Files

Read in this order before making changes:

1. `HANDOVER.md`
2. `AGENTS.md`
3. `docs/173_RELEASE_STATE_v291_2026-05-01.md`
4. `docs/169_RELEASE_STATE_v290_2026-04-29.md`
5. `docs/168_RELEASE_STATE_v289_2026-04-29.md`
6. `docs/167_THIRD_PARTY_ASSESSMENT_PUBLIC_SEPARATION_2026-04-28.md`
7. `docs/165_HANDOVER_PUBLIC_PORTAL_SEPARATION_PLAN_2026-04-28.md`
8. `docs/09_DEPLOYMENT_POLICY.md`
9. `docs/05_AUTH_AND_ROLE_SPEC.md`
10. `docs/04_DB_OPERATION_RUNBOOK.md`
11. `docs/03_DATA_MODEL.md`

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

- Admin `@47` whiteout occurred historically.
- Admin is currently stable at `@49`.

Recommended approach:

1. Diff any future pruning candidate against the current stable admin artifact `@49` and the historical failed `@47` output if needed.
2. Identify first-paint dependencies and bootstrap dependencies.
3. Add explicit admin seed allowlist for initial display.
4. Build locally, perform syntax check and boundary audit.
5. Deploy only after operator browser check plan is ready.

### Task C: Member split physical pruning hardening

Goal: Continue member separation without repeating v283 dependency regression.

Current state:

- Member `@40` remains deployed.
- Physical pruning can break alias / wrapper / reassignment patterns.
- Source-side boundary audit was deployed in `v291`.

Recommended approach:

1. Improve dependency analyzer or move to AST-based generation.
2. Keep `npm run security:member-boundary` in the release gate and expand it when member workflows add actions.
3. Validate member login, training list, applied training, member update, password change, apply/cancel, withdrawal flows.

### Task D: Password hashing standard alignment

Goal: Move from GAS-constrained PBKDF2 toward current global password-storage standards.

Current state:

- Current implementation uses versioned PBKDF2-HMAC-SHA256 + verifier-side pepper and rehash-on-login from legacy SHA-256 / legacy PBKDF2 verifier formats.
- `v291` configured Script Property `PASSWORD_HASH_PEPPER_V1` in integrated/public, member split, and admin split projects. The value is not recorded in Git, docs, handover, logs, chat, or generated artifacts.
- `v291` raises user-changed and generated passwords to 15 characters minimum.
- This is better than single SHA-256 and aligns with NIST verifier-side keyed hash guidance, but does not meet OWASP Password Storage Cheat Sheet guidance for PBKDF2-HMAC-SHA256 work factor (`600,000+`) and is not memory-hard.
- GAS runtime constraints make Argon2id/scrypt difficult inside Apps Script itself.
- Detail: `docs/171_PASSWORD_HASH_STANDARD_ALIGNMENT_2026-04-30.md`

Recommended approach:

1. Keep the same `PASSWORD_HASH_PEPPER_V1` Script Property configured in integrated/public, member split, and admin split projects until a documented rotation or migration plan exists.
2. Benchmark whether PBKDF2-HMAC-SHA256 can be raised without breaking login latency and Apps Script execution limits.
3. If benchmark cannot meet current guidance, design an external authentication/KDF component or managed identity option while preserving the user-facing `loginId + password` requirement.
4. Document the chosen target, migration method, rollback, and user impact before implementation.

### Task E: Source ownership cleanup

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
- Admin physical pruning has a safe redesign and no longer depends on the historical rollback state as the long-term state.
- Member/admin split artifacts have boundary audits comparable to public and those audits remain part of release gates.
- Generated artifact ownership is enforced mechanically.
- Password hashing either meets current guidance or has an approved architecture to reach it without violating GAS constraints.

## 8. Verification Snapshot

Last verified in v291:

- `npm run build:gas`: PASS
- `npm run build:gas:member`: PASS
- `npm run build:gas:admin`: PASS
- `npm run prerelease`: PASS
- `npm run security:public-boundary`: PASS through prerelease
- `npm run security:split-boundary`: PASS through prerelease
- `npx clasp deployments --json`: integrated/public `@290` × 2, member `@40`, admin `@49`
- `npx clasp run healthCheck`: not available in this session due Apps Script execution permission; deployment verification used `clasp deployments --json`.
- Headless/browser functional confirmation for v291 admin mailing-list workflow and password flows remains operator confirmation.
