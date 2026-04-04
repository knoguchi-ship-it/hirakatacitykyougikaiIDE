# Deployment Policy

Updated: 2026-04-05
Production: `v170` / fixed deployments `@170`

## 1. Purpose
- Keep member and public URLs stable.
- Sync both fixed deployments to the same version on every release.
- Avoid `/exec` 404 regressions and accidental Web app type loss.

## 2. Fixed Deployment IDs
| Purpose | Deployment ID | URL |
|---|---|---|
| Member portal | `AKfycbywpWoYxij6A-ZunIeBjG1Q8qX78PMMTsT3frx1cM5PJ2nAuZpz81KruXb5LIvWgbQx` | `/exec` |
| Public portal | `AKfycbxyuUXgK1oHUDMahQjluiL-gcrMK0qV0FWLFYaYBqGxlRSg9NhvmbyQRyf0dvaqg7Zp` | `/exec?app=public` |

Both fixed deployments currently point to `@170`.

## 3. Standard Release Steps
### 3.1 Pre-checks
```bash
git status --short
npm run typecheck
npm run build
npm run build:gas
cd backend
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
- Open Apps Script UI `Deploy > Manage deployments`.
- Update the member portal deployment to the new version.
- Update the public portal deployment to the same version.
- Confirm both remain `Web app` deployments.

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
- Both fixed deployments point to the same version.
- Apps Script UI shows both as `Web app`.
- `healthCheck` and `getDbInfo` succeed.
- Source-of-truth documents are updated.

## 5. Prohibited Actions
- Do not use `clasp deploy --deploymentId` for production updates.
- Do not update only one of the two fixed deployments.
- Do not call a release complete before docs are updated.
- Do not change production deployment IDs without recording the reason.

## 6. First Troubleshooting Steps
### `/exec` returns 404
1. Check `npx clasp deployments --json`.
2. Check Apps Script UI `Manage deployments`.
3. Re-save the fixed deployment version.
4. If that fails, record the evidence before issuing a new deployment.

### `clasp run` fails
1. Check `npx clasp show-authorized-user`.
2. Read `docs/16_INCIDENT_clasp_run_permission_2026-03-14.md`.
3. Repair the operator auth state.

### Document mojibake appears
- Re-save in UTF-8 and re-open the file.
- Do not leave corrupted source documents in place.

## 7. Current Recorded State
### 2026-04-04 `v170`
- Version `170` created with `npx clasp version "v170 fix admin fiscal-year filtering and all-period dashboard label"`.
- Both fixed deployments synced to `@170`.
- Verified with `npx clasp deployments --json`.
- `npm run typecheck`, `npm run build`, `npm run build:gas`, `npx clasp run healthCheck`, and `npx clasp run getDbInfo` passed.
- Production DB was subsequently rolled back by the user on 2026-04-04 to restore data integrity; treat this as the current reconciled baseline after the code release.

### 2026-04-02 `v166`
- Version `166` created with `npx clasp version "v166 remove demo/mock member login paths and align business member profile rules"`.
- Both fixed deployments synced to `@166`.
- Verified with `npx clasp deployments --json`.
- `npm run typecheck`, `npm run build`, `npm run build:gas`, `npx clasp run healthCheck`, and `npx clasp run getDbInfo` passed.

### 2026-04-02 `v165`
- Released self-save fixes to `@165`.

### 2026-04-02 `v160`
- Released demo-selector removal and logout relocation to `@160`.
