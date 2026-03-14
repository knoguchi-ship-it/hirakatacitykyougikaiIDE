# Incident Report: `clasp run` permission failure (2026-03-14)

## Scope
- Project: `hirakatacitykyougikaiIDE`
- Script ID: `11YRlyWVgWRFw5_zByfLnA_vUlZzLeBSgiaanQCvZZoHMAfay8yK7RdkL`
- Checked account: `k.noguchi@uguisunosato.or.jp`
- Check date: 2026-03-14 (JST)

## Symptom
- `npx clasp run healthCheck` fails with:
  - `Unable to run script function. Please make sure you have permission to run the script function.`
- `npx clasp run healthCheck --nondev` fails with:
  - `Script function not found. Please make sure script is deployed as API executable.`

## Facts verified
- `clasp` authorized user is `k.noguchi@uguisunosato.or.jp`.
- Apps Script sharing dialog shows the same account as **Owner**.
- Execution API deployment exists and is valid:
  - Deployment ID: `AKfycbxoKygppxIeYROyjdXCbhKrfgLI6IcPI1hZlc1O44JtS5EEDuWWryJnE_ZPPo3q_eXD`
  - Version: `79`
  - Entry point: `EXECUTION_API`
  - Access: `DOMAIN`
- Cloud IAM for linked GCP project (`uguisu-gas-exec-20260225191000`):
  - `k.noguchi@uguisunosato.or.jp` has `roles/owner`.

## API-level error details
- `scripts.run` with `scriptId` + `devMode:true` => `403 PERMISSION_DENIED` (`The caller does not have permission`)
- `scripts.run` with `scriptId` + `devMode:false` => `404 NOT_FOUND` (`Requested entity was not found`)
- `scripts.run` with `deploymentId` endpoint => `403 PERMISSION_DENIED`
- Even after temporary `EXECUTION_API access = ANYONE` test deployment, `deploymentId` call still returned `403`.

## Root cause assessment
- Code issue: **No** (target function exists and deploy is valid).
- Deployment missing: **No** (Execution API deploy exists with `DOMAIN` access).
- Account mismatch: **No** (same owner account is authenticated).
- Most likely cause: **Execution API caller OAuth-client/channel restriction outside source code**
  - Access level (`DOMAIN`/`ANYONE`) was not the blocker in this environment.
  - `clasp push/version/deploy` succeeds, while runtime `scripts.run` is denied.
  - This pattern matches caller-channel restrictions (org policy / allowed OAuth client path) rather than script implementation bugs.

## Resolution path (recommended)
1. Keep using account `k.noguchi@uguisunosato.or.jp` for this project.
2. In Apps Script editor, verify deployment access remains:
   - Deploy -> New deployment -> Executable API
   - Access: `Within domain`
3. Use an OAuth client issued from the same linked GCP project (`uguisu-gas-exec-20260225191000`) for execution calls.
   - Do not rely on default shared OAuth clients for `scripts.run` troubleshooting.
4. Have Google Workspace/GCP admin verify org restrictions for Apps Script Execution API (`script.googleapis.com`) caller usage.
5. After policy/client alignment, rerun:
   - `npx clasp run healthCheck`
   - `npx clasp run getDbInfo`
6. If still blocked, use direct API probe with deployment ID to collect exact status code and provide it to admin.

## Effective fix confirmed (2026-03-14)
- Reauthenticated `clasp` with a project-owned OAuth client:
  - `npx clasp logout`
  - `npx clasp login --creds .tmp/oauth-client-uguisu-gas-exec.json --use-project-scopes --no-localhost`
- Account used: `k.noguchi@uguisunosato.or.jp`
- Result:
  - `npx clasp run healthCheck` => success (`ok: true`)
  - `npx clasp run getDbInfo` => success (DB metadata returned)

## Cost impact
- No additional billing was required for this fix itself.

## Related standard
- Follow the common RCA flow in `docs/17_ROOT_CAUSE_ERROR_RESPONSE_PLAYBOOK.md`.

## Temporary operation rule
- Do not gate release verification only on `clasp run`.
- Use Web app smoke checks and editor-side function execution as primary runtime checks until `scripts.run` permission is restored.
