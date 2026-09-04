# Third-Party Assessment: Public Separation v288

作成日: 2026-04-28
評価対象: `v288` integrated/public fixed deployments `@287`
評価観点: 旧統合 URL から公開ポータル以外の処理が分離できているか

## 1. Verdict

結論: **不合格 / 分離未完了**。

理由: public artifact の admin/member action handler と HTML は分離済みだが、旧統合 URL から `google.script.run` で呼べるトップレベル公開関数として `rebuildDatabaseSchema` と `getDbInfo` が残っている。

特に `rebuildDatabaseSchema` は DB schema 再構築と定義外シート削除に到達するため、公開匿名 Web App に残すことはできない。UI に表示されないことは防御にならない。

## 2. Assessment Standard

2026-04-28 時点で確認した一次ソース:

- OWASP ASVS: 最新安定版は `5.0.0`。Web application security verification の基準として使用。
- OWASP WSTG Authorization Testing: authorization schema bypass、privilege escalation、IDOR、OAuth weakness を確認対象とする。
- NIST SP 800-63-4: 2025-08-01 以降の現行 Digital Identity Guidelines。認証・認可・リスク管理の現行基準として使用。
- Google Apps Script Authorization / OAuth Scopes: published web app は最小 scope を明示し、機密 scope は慎重に扱う。
- Google Apps Script Web Apps: `executeAs: USER_DEPLOYING` はデプロイユーザー権限で実行されるため、公開面のサーバー関数を最小化する必要がある。
- Google Apps Script HTML Service communication: `google.script.run` はサーバー関数を呼べる。末尾 `_` の private functions は client から不可視。

評価基準は、案件正本の 3 境界（admin / member / public）に加え、上記基準を「public anonymous surface には public 業務機能以外の実行入口を残さない」と解釈して適用した。

## 3. Evidence

### 3.1 Deployment / URL

`npx clasp deployments --json`:

- Integrated legacy deployment: `AKfycbywpWoYxij6A-ZunIeBjG1Q8qX78PMMTsT3frx1cM5PJ2nAuZpz81KruXb5LIvWgbQx` -> `@287`
- Public portal deployment: `AKfycbxyuUXgK1oHUDMahQjluiL-gcrMK0qV0FWLFYaYBqGxlRSg9NhvmbyQRyf0dvaqg7Zp` -> `@287`
- Member split remains `@39`
- Admin split remains `@46`

### 3.2 Public artifact files

Integrated/public push target contains:

- `backend/appsscript.json`
- `backend/Code.gs`
- `backend/index_public.html`

`backend/index.html` and `backend/index_admin.html` are not present in the public push target.

### 3.3 Route behavior

`doGet(e)` ignores URL parameters and returns `index_public` for the integrated/public script ID. This satisfies the URL-level separation goal.

### 3.4 Action handler separation

`processApiRequest(action, payload)` uses `PUBLIC_ALLOWED_ACTIONS` and rejects non-public action names with `unsupported_action`.

Admin/member action names were not found in `backend/Code.gs` or `backend/index_public.html` for:

- `memberLoginWithData`
- `adminLoginWithData`
- `checkAdminBySession`
- `getMemberPortalData`
- `updateMemberSelf`
- `getAdminDashboardData`
- `getAdminInitData`
- `getSystemSettings`
- `updateSystemSettings`
- `fetchAllData`

### 3.5 Remaining public top-level functions

The generated `backend/Code.gs` exposes these top-level functions without trailing `_`:

- `doGet`
- `rebuildDatabaseSchema`
- `getDbInfo`
- `healthCheck`
- `processApiRequest`

`doGet` and `processApiRequest` are required public entry points. `healthCheck` is low-risk diagnostic. `getDbInfo` leaks spreadsheet metadata and should not be callable from anonymous HTML. `rebuildDatabaseSchema` is critical because it calls schema initialization and cleanup routines.

## 4. Findings

### Critical: Public caller can invoke `rebuildDatabaseSchema`

Impact:

- Anonymous public page users can attempt to call `google.script.run.rebuildDatabaseSchema()` from browser developer tools.
- Because the web app runs as `USER_DEPLOYING`, execution occurs with deployer authority.
- The function calls `initializeSchema_`, `markSchemaInitialized_`, `setupThumbnailGenerationTrigger_`, and `cleanupNonSchemaSheets_`.
- This violates least privilege, authorization bypass prevention, and public/admin/member boundary separation.

Required remediation:

- Remove `rebuildDatabaseSchema` from the public artifact.
- Keep it only in full source and admin/maintenance execution context.
- Add a build-time assertion that public artifact top-level callable functions are exactly an approved list.

### High: Public caller can invoke `getDbInfo`

Impact:

- Anonymous public page users can attempt to call `google.script.run.getDbInfo()` from browser developer tools.
- The function returns spreadsheet ID, sheet list, and spreadsheet URL.
- It is a metadata disclosure and confirms internal storage layout.

Required remediation:

- Remove `getDbInfo` from public artifact or gate it behind a non-public maintenance project.
- Do not preserve diagnostics in public web app if they can be called by `google.script.run`.

### Medium: Build reachability analysis can keep functions referenced only by comments/strings

Impact:

- The current dependency scanner matches function-like tokens in function bodies without excluding comments and strings.
- A comment or error message containing `rebuildDatabaseSchema()` can keep a top-level function reachable.
- This weakens pruning guarantees and can reintroduce maintenance functions into public artifacts.

Required remediation:

- Strip comments and string literals before call graph extraction, or use an AST parser.
- Add explicit public callable allowlist validation after build.

### Medium: OAuth scope set remains broad for a public anonymous web app

Impact:

- `backend/appsscript.json` includes spreadsheet, external request, send mail, and Drive scopes.
- Some public workflows legitimately need Sheets, Mail, and Drive access, but the public web app runs as deployer.
- Broad scopes increase blast radius if any public callable function remains exposed.

Required remediation:

- After removing public callable diagnostics/maintenance functions, re-evaluate whether `drive` can be narrowed or isolated.
- Treat scope reduction as secondary; server callable minimization is the immediate blocker.

## 5. Answer to the User Question

旧統合 URL について、ポータルサイト以外の処理は **全ては分離できていない**。

分離できている:

- public URL / deployment ID 維持
- public HTML 固定
- admin/member HTML の public artifact からの除去
- admin/member action handler の `processApiRequest` からの除去
- member split / admin split の deployment 独立維持

分離できていない:

- public Web App から直接呼べるトップレベル maintenance / diagnostic functions が残存
- 特に `rebuildDatabaseSchema` は公開匿名面に存在してはいけない

## 6. Required Release Gate Before Completion

`v289` 以上で以下を満たすまで、public separation は完了扱いにしない。

- public artifact のトップレベル公開関数が `doGet`, `processApiRequest`, 必要最小の低リスク関数だけであること。
- `rebuildDatabaseSchema`, `getDbInfo` が public artifact から消えていること。
- build 後に以下の検査を CI/手順へ追加すること:

```bash
rg -n "^function\s+(rebuildDatabaseSchema|getDbInfo|.*Admin.*|.*MemberPortal.*|.*Login.*)\b" backend/Code.gs
rg -o "^function\s+[A-Za-z0-9_]+" backend/Code.gs
```

- `npx clasp push --force -> npx clasp version -> fixed deployment 2本 redeploy -> deployments確認` を実施すること。
- 操作者の実ブラウザ確認を再実施すること。

## 7. Recommended Remediation Plan

1. Update public build pruning so public artifact has an explicit top-level callable allowlist.
2. Remove `getDbInfo` from public seed list.
3. Ensure `rebuildDatabaseSchema` is not kept by comment/string false-positive reachability.
4. Keep diagnostics in split/maintenance context, not in anonymous public web app.
5. Release as small emergency security release `v289`.
