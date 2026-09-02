# Release state: v376.60 (2026-09-02)

## Scope

- Fix automatic application-receipt gating so a persisted Boolean false is
  treated as OFF rather than as an unset value.
- Route business application notifications to the staff member whose role is
  REPRESENTATIVE; missing representative data fails closed.
- Consolidate automatic-mail sender selection through the configured shared
  automatic sender. Explicit manual/bulk-mail sender choices remain untouched.
- Keep the mail-template manager reachable while a category is OFF.
- Add non-sending, non-writing operator dry-runs and automated browser/unit
  test evidence.

## Deployment

- Public fixed deployments: version 365 (two deployments)
- Member fixed deployment: version 124
- Admin fixed deployment: version 221
- All four fixed deployments were synchronized through clasp redeploy; no
  deployment URL was changed.

## Verification

- Pre-release security/boundary/type checks and the dedicated mail unit tests:
  passed before deployment.
- Generated public/member/admin GAS artifacts contain the automatic sender
  helper; admin artifact contains the new dry-run.
- Fixed-deployment version verification: passed.
- Production public accessibility scan: passed with zero violations.
- Production public responsive scan, admin UI E2E, and Execution API dry-runs:
  not release-closing passes. Their actual FAIL/BLOCKED statuses and safe
  evidence are recorded in docs/portal/test-report.html.

## Follow-up

1. Refresh the authenticated admin browser state and rerun the admin Playwright
   E2E.
2. Grant/restore Apps Script Execution API permission for the operator account,
   then run the two dryRun LOG functions. They do not send mail or write DB
   rows.
3. Complete Gmail authorization for the added send scope in the public/member
   Apps Script projects if Apps Script prompts the deployment account.
