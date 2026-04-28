# Deployment Policy

Updated: 2026-04-29
Production: `v289` / 統合（公開）fixed deployments `@288` / 会員 split `@39` / 管理者 split `@46`

## 1. Purpose

- Keep member, public, and admin URLs stable.
- Sync every fixed deployment on each production release.
- Use terminal `clasp redeploy` as the standard production path.
- Avoid Apps Script UI manual deployment edits except for emergency recovery.
- Record deployment evidence in release state documents.

## 2. Fixed Deployment IDs

### Integrated public project

| Purpose | Deployment ID | Current version |
|---|---|---|
| Legacy member portal deployment | `AKfycbywpWoYxij6A-ZunIeBjG1Q8qX78PMMTsT3frx1cM5PJ2nAuZpz81KruXb5LIvWgbQx` | `@288` (`v289`) |
| Public portal | `AKfycbxyuUXgK1oHUDMahQjluiL-gcrMK0qV0FWLFYaYBqGxlRSg9NhvmbyQRyf0dvaqg7Zp` | `@288` (`v289`) |

### Split projects

| Purpose | Script ID | Deployment ID | Current version | Access |
|---|---|---|---|---|
| member | `1ZKFJKNr4IzbguZvO4KbtSOE1BzkrzOG8OV2tF0RFdk28EnZTCL4Sx3dJ` | `AKfycbxd_6HlH5aWLhxYOtLUHehI3ODiHg4fpc5SCzNdEBIDbDpaBuU3KTuqDRbeBmhWZxSQ_g` | `@39` (`v287`) | `ANYONE_ANONYMOUS` |
| admin | `1tlBJ-OJjqNQQxzb5tY3iRUlS4DmQD9sYqw5j842tXD1SPVHutBUeKTRi` | `AKfycbwSCTTyvWY_cFG764XawdbqA8r0qxYbav4aDZ-BK9rRmvXHoUXrKQnQ9egRGqWcx4Os` | `@46` (`v286 rollback`) | `DOMAIN` |

## 3. Standard Release Steps

### Pre-check

```bash
git status --short
git diff
npm run security:audit
npm run typecheck
npm run build:gas
```

If the release affects split projects, also run:

```bash
npm run build:gas:member
npm run build:gas:admin
```

### Push and version

```bash
npx clasp push --force
npx clasp version "<release note>"

cd gas/member
npx clasp push --force
npx clasp version "<release note>"

cd ../admin
npx clasp push --force
npx clasp version "<release note>"
```

### Fixed deployment sync

```bash
npx clasp redeploy AKfycbywpWoYxij6A-ZunIeBjG1Q8qX78PMMTsT3frx1cM5PJ2nAuZpz81KruXb5LIvWgbQx --versionNumber <version> --description "<release note>"
npx clasp redeploy AKfycbxyuUXgK1oHUDMahQjluiL-gcrMK0qV0FWLFYaYBqGxlRSg9NhvmbyQRyf0dvaqg7Zp --versionNumber <version> --description "<release note>"

cd gas/member
npx clasp redeploy AKfycbxd_6HlH5aWLhxYOtLUHehI3ODiHg4fpc5SCzNdEBIDbDpaBuU3KTuqDRbeBmhWZxSQ_g --versionNumber <version> --description "<release note>"

cd ../admin
npx clasp redeploy AKfycbwSCTTyvWY_cFG764XawdbqA8r0qxYbav4aDZ-BK9rRmvXHoUXrKQnQ9egRGqWcx4Os --versionNumber <version> --description "<release note>"
```

### Verification

```bash
npx clasp deployments --json
cd gas/member && npx clasp deployments --json
cd ../admin && npx clasp deployments --json
```

Real-browser verification is performed by the operator by default. The agent records code-level verification, build results, Apps Script command results, and browser-side confirmation points.

## 4. Done Criteria

- `git diff` and `git status --short` reviewed before push.
- Untracked files classified as tracked target or allowed local/generated artifact.
- `npm run security:audit` has no high or critical findings.
- `npm run typecheck` passes.
- Required build commands pass.
- `clasp push`, `clasp version`, and `clasp redeploy` succeed.
- `npx clasp deployments --json` confirms every fixed deployment points to the intended version.
- `HANDOVER.md`, this deployment policy, document index, and release state are updated.
- Browser-side residual checks are listed if not performed by the agent.

## 5. Prohibited Actions

- Do not use `clasp deploy --deploymentId` for production updates.
- Do not update only one fixed deployment.
- Do not call a release complete before source documents are updated.
- Do not use Apps Script UI deployment edits as the default path.
- Do not change production deployment IDs without recording the reason.

## 6. Current Recorded State

### 2026-04-29 `v289` ← current production

- Scope: v288 第三者評価で検出した public callable maintenance / diagnostic entrypoint を除去。public generated `backend/Code.gs` の top-level callable を `doGet`, `processApiRequest`, `healthCheck` に限定。
- Integrated fixed deployments: `@288` × 2.
- Member split: `@39`.
- Admin split: `@46`.
- Detail: `docs/168_RELEASE_STATE_v289_2026-04-29.md`

### 2026-04-28 `v288`

- Scope: 統合 project の generated `backend/Code.gs` を public-only artifact に縮退。公開ポータル URL / deployment ID は維持し、member split `@39` と admin split `@46` は未変更。
- Integrated fixed deployments: `@287` × 2.
- Member split: `@39`.
- Admin split: `@46`.
- Detail: `docs/166_RELEASE_STATE_v288_2026-04-28.md`

### 2026-04-28 `v287-partial`

- Scope: member split の生成済み `Code.gs` から境界外関数を物理削除。admin split は `@47` でホワイトアウトしたため `@46` へロールバック済み。統合/公開は `@285` 維持。
- Integrated fixed deployments: `@285` × 2.
- Member split: `@39`.
- Admin split: `@46`.
- Detail: `docs/164_RELEASE_STATE_v287_2026-04-28.md`

### 2026-04-28 `v286`

- Scope: `saveMemberCore_` の admin-only 代表者検証・監査ログを option 明示化。会員セルフ更新の機能変更なし。
- Integrated fixed deployments: `@285` × 2.
- Member split: `@38`.
- Admin split: `@46`.
- Detail: `docs/163_RELEASE_STATE_v286_2026-04-28.md`

### 2026-04-27 `v285`

- Scope: `updateMember_` を admin wrapper、`saveMemberCore_` を実保存 core に分離。
- Integrated fixed deployments: `@284` × 2.
- Member split: `@37`.
- Admin split: `@45`.
- Detail: `docs/162_RELEASE_STATE_v285_2026-04-27.md`
