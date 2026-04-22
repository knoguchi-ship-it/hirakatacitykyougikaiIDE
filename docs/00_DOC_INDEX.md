# Document Index

Updated: 2026-04-22
Scope: 次担当者が迷わず再開できるよう、文書を目的別に整理した索引。

## 1. Structure

このリポジトリの文書構成は、2026-04-22 時点の Diataxis と GitHub Docs content model の考え方に合わせて、**読者の目的別** に整理する。

- Entry points: 再開・運用開始時に最初に読む文書
- Reference: 現行仕様の正本
- How-to / Operations: 手順、運用、障害対応
- Active tasks / plans: 未完了の実装計画や調査チケット
- Release records: 直近の本番反映記録
- Archive: 完了済み、置換済み、古い履歴

## 2. Entry Points

- `HANDOVER.md`
- `AGENTS.md`
- `GLOBAL_GROUND_RULES/docs/AI_RULES/05_PROJECT_RULES_HIRAKATA.md`
- `GLOBAL_GROUND_RULES/docs/AI_RULES/00_OPERATING_MODEL.md`
- `GLOBAL_GROUND_RULES/docs/AI_RULES/10_WORKFLOW_AND_QUALITY.md`
- `GLOBAL_GROUND_RULES/docs/AI_RULES/20_SECURITY_APPROVALS.md`
- `GLOBAL_GROUND_RULES/docs/AI_RULES/30_ERROR_MEMORY.md`
- `GLOBAL_GROUND_RULES/docs/AI_RULES/40_DOCS_AND_TEACHING.md`
- `docs/44_DEVELOPMENT_HANDOVER_PLAYBOOK_2026-04-04.md`
- Latest release-state referenced from `HANDOVER.md`

## 3. Reference

### Product and architecture

- `docs/01_PRD.md`
- `docs/10_SOW.md`
- `docs/02_ARCHITECTURE.md`
- `docs/03_DATA_MODEL.md`
- `docs/05_AUTH_AND_ROLE_SPEC.md`
- `docs/11_WITHDRAWAL_DELETION_POLICY.md`

### Platform and deployment

- `docs/04_DB_OPERATION_RUNBOOK.md`
- `docs/08_GCP_SETUP_RUNBOOK_2026-02-28.md`
- `docs/09_DEPLOYMENT_POLICY.md`

### Decisions and assessments

- `docs/06_DECISION_RECORD_AUTH_2026-02-28.md`
- `docs/07_DECISION_RECORD_PUBLIC_PORTAL_2026-03-13.md`
- `docs/13_DECISION_RECORD_MAIL_CONSOLE_2026-03-13.md`
- `docs/18_DECISION_RECORD_ANNUAL_FEE_CONSOLE_2026-03-15.md`
- `docs/19_DECISION_RECORD_PUBLIC_PORTAL_APPLICATION_INTEGRATION_2026-03-17.md`
- `docs/109_THIRD_PARTY_ASSESSMENT_2026-04-20.md`
- `docs/110_REMEDIATION_PLAN_PORTAL_URL_AND_AUTH_2026-04-20.md`
- `docs/111_IMPLEMENTATION_BLUEPRINT_PROJECT_SPLIT_2026-04-20.md`

## 4. How-To / Operations

- `docs/44_DEVELOPMENT_HANDOVER_PLAYBOOK_2026-04-04.md`
- `docs/17_ROOT_CAUSE_ERROR_RESPONSE_PLAYBOOK.md`
- `docs/16_INCIDENT_clasp_run_permission_2026-03-14.md`
- `docs/36_DATA_PROTECTION_PROCEDURES.md`
- `docs/37_GAS_QUOTAS_AND_LIMITS.md`
- `docs/39_IMPLEMENTATION_BEST_PRACTICES_2026-03-31.md`
- `docs/63_SOW_ROSTER_PDF_AND_BULK_MAIL_2026-04-10.md`
- `docs/66_ROSTER_TEMPLATE_GUIDE_2026-04-10.md`
- `docs/31_HANDOVER_TASK_TEMPLATE.md`

## 5. Active Tasks And Plans

- `docs/58_NEXT_TASK_PERFORMANCE_2026-04-09.md`
- `docs/113_TASK_CM_NUMBER_EDIT_POLICY_2026-04-20.md`
- `docs/120_TASK_SECURITY_DENY_BY_DEFAULT_2026-04-21.md`
- `docs/121_TASK_SECURITY_IDOR_FIX_2026-04-21.md`
- `docs/122_TASK_SECURITY_PASSWORD_HASHING_2026-04-21.md`
- `docs/123_TASK_SECURITY_SCOPE_AND_CI_2026-04-21.md`

## 6. Current Release Records

直近 5 version のみ root `docs/` に置く。

- `docs/131_RELEASE_STATE_v259_2026-04-22.md` - latest
- `docs/129_RELEASE_STATE_v258_2026-04-22.md`
- `docs/127_RELEASE_STATE_v257_2026-04-21.md`
- `docs/125_RELEASE_STATE_v256_2026-04-21.md`
- `docs/119_RELEASE_STATE_v255_2026-04-21.md`

それより古い release は `docs/archive/release_history/` を参照する。

## 7. Archive

### Historical

- `docs/archive/historical/`:
  - 完了済み task 個票
  - 過去 handover
  - 完了済みの一時的な実装記録

### Obsolete

- `docs/archive/obsolete/`:
  - 未採用
  - 後続 task に置換済み
  - 現行仕様の判断材料としては使わない文書

### Release history

- `docs/archive/release_history/`:
  - 直近 5 version より古い release state

### Legacy reference

- `docs/learning/` は参照専用であり、正本ではない。

## 8. Placement Rules

- root `docs/` に残すのは「正本」「運用手順」「進行中タスク」「直近 5 version の release 記録」だけ。
- 完了済み task は `docs/archive/historical/` へ移す。
- 未採用または superseded の task は `docs/archive/obsolete/` へ移す。
- release state は毎回作成するが、直近 5 version を超えたら `docs/archive/release_history/` へ移す。
- 新しい文書を追加したら、この索引と `HANDOVER.md` の両方を同ターンで更新する。
