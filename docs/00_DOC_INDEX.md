# Document Index

Updated: 2026-04-16 (v208 — docs reorganized)

## 1. Entry Sources Of Truth
- `HANDOVER.md`
- `AGENTS.md`
- `GLOBAL_GROUND_RULES/docs/AI_RULES/05_PROJECT_RULES_HIRAKATA.md`
- `GLOBAL_GROUND_RULES/docs/AI_RULES/00_OPERATING_MODEL.md`
- `GLOBAL_GROUND_RULES/docs/AI_RULES/10_WORKFLOW_AND_QUALITY.md`
- `GLOBAL_GROUND_RULES/docs/AI_RULES/20_SECURITY_APPROVALS.md`
- `GLOBAL_GROUND_RULES/docs/AI_RULES/30_ERROR_MEMORY.md`
- `GLOBAL_GROUND_RULES/docs/AI_RULES/40_DOCS_AND_TEACHING.md`
- `docs/44_DEVELOPMENT_HANDOVER_PLAYBOOK_2026-04-04.md`
- Latest release-state document referenced from `HANDOVER.md`
- `docs/09_DEPLOYMENT_POLICY.md`
- `docs/05_AUTH_AND_ROLE_SPEC.md`
- `docs/04_DB_OPERATION_RUNBOOK.md`
- `docs/03_DATA_MODEL.md`
- `CLAUDE.md` is legacy-only; `AGENTS.md` is the canonical entry point

## 2. Functional Sources Of Truth
- `docs/01_PRD.md`
- `docs/02_ARCHITECTURE.md`
- `docs/03_DATA_MODEL.md`
- `docs/04_DB_OPERATION_RUNBOOK.md`
- `docs/05_AUTH_AND_ROLE_SPEC.md`
- `docs/11_WITHDRAWAL_DELETION_POLICY.md`

## 3. Ops And Incident Docs

### 現行リリース記録（v205〜v208）
- `docs/79_HANDOVER_2026-04-15.md` - **引継ぎ資料（v208時点）** - 機能・運用・落とし穴まとめ
- `docs/78_RELEASE_STATE_v208_2026-04-15.md` - **v208 current** - 宛名リスト バグ修正（事業所名・flush）
- `docs/77_RELEASE_STATE_v207_2026-04-15.md` - v207 record - 宛名リスト Excel 出力コンソール
- `docs/76_RELEASE_STATE_v206_2026-04-15.md` - v206 record - T_会員 住所2列（建物名）追加
- `docs/75_RELEASE_STATE_v205_2026-04-14.md` - v205 record - 名簿PDF出力 1000件対応アーキテクチャ
- 過去リリース記録（v170〜v204）: `docs/archive/release_history/`

### 運用・インシデント
- `docs/09_DEPLOYMENT_POLICY.md`
- `docs/44_DEVELOPMENT_HANDOVER_PLAYBOOK_2026-04-04.md`
- `docs/08_GCP_SETUP_RUNBOOK_2026-02-28.md`
- `docs/16_INCIDENT_clasp_run_permission_2026-03-14.md`
- `docs/17_ROOT_CAUSE_ERROR_RESPONSE_PLAYBOOK.md`
- `docs/66_ROSTER_TEMPLATE_GUIDE_2026-04-10.md`
- `docs/63_SOW_ROSTER_PDF_AND_BULK_MAIL_2026-04-10.md` - SOW完了（Phase 1〜3）

### 未完了タスク
- `docs/58_NEXT_TASK_PERFORMANCE_2026-04-09.md` - B-02 パフォーマンス改善（未着手）

## 4. Handover Tasks
- Template: `docs/31_HANDOVER_TASK_TEMPLATE.md`
- 完了済みタスク記録: `docs/archive/historical/`

## 5. Decision Records (ADR)
- `docs/06_DECISION_RECORD_AUTH_2026-02-28.md`
- `docs/07_DECISION_RECORD_PUBLIC_PORTAL_2026-03-13.md`
- `docs/13_DECISION_RECORD_MAIL_CONSOLE_2026-03-13.md`
- `docs/18_DECISION_RECORD_ANNUAL_FEE_CONSOLE_2026-03-15.md`
- `docs/19_DECISION_RECORD_PUBLIC_PORTAL_APPLICATION_INTEGRATION_2026-03-17.md`

## 6. Reference And Compliance
- `docs/36_DATA_PROTECTION_PROCEDURES.md`
- `docs/37_GAS_QUOTAS_AND_LIMITS.md`
- `docs/39_IMPLEMENTATION_BEST_PRACTICES_2026-03-31.md`
- `docs/learning/index.html` — 学習用資料（参照のみ）
- 旧仕様書・実装記録: `docs/archive/historical/`

## 7. Rules
- Update canonical docs in the same turn as code or deployment changes.
- Record task documents as handover artifacts, not as substitutes for canonical specs.
- `docs/learning/` is reference-only and never the source of truth.
- Archive or replace obsolete entry points instead of leaving them ambiguous.
- Release state docs older than 5 versions live in `docs/archive/release_history/`.
- Completed task/spec docs live in `docs/archive/historical/`.
