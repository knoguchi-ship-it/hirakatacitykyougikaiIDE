# Document Index

Updated: 2026-04-20 (v249)

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

### 再開用の最小セット
- `HANDOVER.md` - 再開入口。最新本番状態、読む順序、未解決課題、再開時チェックを集約
- `docs/44_DEVELOPMENT_HANDOVER_PLAYBOOK_2026-04-04.md` - 開始/完了チェックの運用正本
- Latest release-state document referenced from `HANDOVER.md` - 直近変更の詳細

### 現行リリース記録（v235〜v251）
- `docs/117_RELEASE_STATE_v251_2026-04-21.md` - **latest** - 公開ポータル切り分け完了: scriptId ルーティング・3プロジェクト分離確定
- `docs/116_RELEASE_STATE_v250_2026-04-20.md` - 管理者 split: admin shell 修正（member_unauthorized 解消、会員メニュー非表示）
- `docs/115_RELEASE_STATE_v249_2026-04-20.md` - 会員/管理者ポータル分離: 会員ページから管理者タブ除去、`?app=admin` 追加
- `docs/114_RELEASE_STATE_v248_2026-04-20.md` - セキュリティ是正: 会員セッショントークン・IDOR修正・deny-by-default 完成
- `docs/108_RELEASE_STATE_v247_2026-04-20.md` - 事業所職員の氏名/フリガナ入力を `氏 / 名 / セイ / メイ` に統一
- `docs/107_RELEASE_STATE_v246_2026-04-19.md` - 会員マイページ保存の loginId アンカー統一・旧 version 整理
- `docs/106_RELEASE_STATE_v245_2026-04-19.md` - 会員マイページ職員追加 UI 全面改修・バリデーション根本修正
- `docs/105_RELEASE_STATE_v244_2026-04-19.md` - 会員マイページの新規職員ドラフト行 UX 修正
- `docs/104_RELEASE_STATE_v243_2026-04-19.md` - 管理者コンソールの新規職員ドラフト行 UX 修正
- `docs/103_RELEASE_STATE_v242_2026-04-19.md` - `fetchAllDataFromDbFresh_` batch read 最適化 + v239〜v241 本番反映
- `docs/102_RELEASE_STATE_v241_2026-04-19.md` - 単一運用 URL を正本化
- `docs/101_RELEASE_STATE_v240_2026-04-19.md` - 管理者セッション識別子分離・権限変更即時反映
- `docs/100_RELEASE_STATE_v239_2026-04-19.md` - 事業所職員メール必須化・空行許容・メール欄拡張
- `docs/99_RELEASE_STATE_v238_2026-04-19.md` - 再活性化パターン・転籍検索・修復 API
- `docs/98_RELEASE_STATE_v235_2026-04-18.md` - 物理削除・重複修正・loginId セッション設計刷新
- `docs/94_RELEASE_STATE_v231_2026-04-17.md` - 郵便番号入力標準化 + 年会費連続年度表示
- `docs/79_HANDOVER_2026-04-15.md` - 引継ぎ資料（v208時点） - 機能・運用・落とし穴まとめ
- 過去リリース記録: `docs/archive/release_history/`

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
- Latest completed task handover: `docs/archive/historical/89_HANDOVER_TASK_v225_PUBLIC_MEMBERSHIP_TRANSITIONS_2026-04-17.md`
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
- `docs/109_THIRD_PARTY_ASSESSMENT_2026-04-20.md` - 最新の第三者評価。OWASP ASVS 5.0.0 / NIST CSF 2.0 / SSDF / Privacy Framework / WCAG 2.2 基準で評価
- `docs/110_REMEDIATION_PLAN_PORTAL_URL_AND_AUTH_2026-04-20.md` - 公開 URL 維持を前提にした是正計画。`public / member / admin` の分離方針を定義
- `docs/111_IMPLEMENTATION_BLUEPRINT_PROJECT_SPLIT_2026-04-20.md` - 実装着手用の詳細設計。3 Apps Script 分離、移管表、実装順、受け入れ基準を定義
- `docs/learning/index.html` — 学習用資料（参照のみ）
- 旧仕様書・実装記録: `docs/archive/historical/`
- `docs/112_HANDOVER_TASK_PROJECT_SPLIT_SIDE_BY_SIDE_2026-04-20.md` - 次担当者向け必読。side-by-side 分離の現状態、IDs、未了、禁止事項、次の順序を固定

## 7. Rules
- Update canonical docs in the same turn as code or deployment changes.
- Record task documents as handover artifacts, not as substitutes for canonical specs.
- `docs/learning/` is reference-only and never the source of truth.
- Archive or replace obsolete entry points instead of leaving them ambiguous.
- Release state docs older than 5 versions live in `docs/archive/release_history/`.
- Completed task/spec docs live in `docs/archive/historical/`.
- Startup should be possible from `HANDOVER.md` plus the release-state document it points to; use this index only for topic-based deep dives.
