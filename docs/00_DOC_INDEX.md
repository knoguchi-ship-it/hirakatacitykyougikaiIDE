# ドキュメント索引（現行）

更新日: 2026-03-28

## 現行の正本
- `README.md`
- `HANDOVER.md`
- `GLOBAL_GROUND_RULES/AGENTS.md` ← AIエージェント向け常設ルール
- `GLOBAL_GROUND_RULES/CLAUDE.md` ← Claude系エージェント向け常設ルール
- `GLOBAL_GROUND_RULES/docs/AI_RULES/05_PROJECT_RULES_HIRAKATA.md` ← この案件固有のグランドルール
- `GLOBAL_GROUND_RULES/docs/AI_RULES/00_OPERATING_MODEL.md`
- `GLOBAL_GROUND_RULES/docs/AI_RULES/10_WORKFLOW_AND_QUALITY.md`
- `GLOBAL_GROUND_RULES/docs/AI_RULES/20_SECURITY_APPROVALS.md`
- `GLOBAL_GROUND_RULES/docs/AI_RULES/30_ERROR_MEMORY.md`
- `GLOBAL_GROUND_RULES/docs/AI_RULES/40_DOCS_AND_TEACHING.md`
- `docs/01_PRD.md`
- `docs/02_ARCHITECTURE.md`
- `docs/03_DATA_MODEL.md`
- `docs/04_DB_OPERATION_RUNBOOK.md`
- `docs/05_AUTH_AND_ROLE_SPEC.md`
- `docs/06_DECISION_RECORD_AUTH_2026-02-28.md`
- `docs/07_DECISION_RECORD_PUBLIC_PORTAL_2026-03-13.md` ← 公開ポータル追加の設計決定記録
- `docs/08_GCP_SETUP_RUNBOOK_2026-02-28.md`
- `docs/09_DEPLOYMENT_POLICY.md`  ← URL固定デプロイ標準
- `docs/10_SOW.md`                ← 今後の統一仕様/品質保証
- `docs/11_WITHDRAWAL_DELETION_POLICY.md` ← 退会日/削除フラグ運用仕様
- `docs/13_DECISION_RECORD_MAIL_CONSOLE_2026-03-13.md` ← メール送信機能・管理コンソール連携の設計決定記録
- ~~`docs/14_TEST_SPEC_2026-03-13_v75.md`~~ → `Dust/` に退避（v75 用、v105 現在では陳腐化）
- `docs/15_INCIDENT_LOG_2026-03-14_v76.md` ← v75で発生した公開取消障害の原因/修正/再発防止記録
- `docs/16_INCIDENT_clasp_run_permission_2026-03-14.md` ← `clasp run` 実行権限エラー（403/404）の解析記録
- `docs/17_ROOT_CAUSE_ERROR_RESPONSE_PLAYBOOK.md` ← 根本エラー対応書（RCA運用標準）
- `docs/18_DECISION_RECORD_ANNUAL_FEE_CONSOLE_2026-03-15.md` ← 年会費管理コンソール・監査ログ追加の設計決定記録
- `docs/19_DECISION_RECORD_PUBLIC_PORTAL_APPLICATION_INTEGRATION_2026-03-17.md` ← 公開ポータルへの新規入会統合の決定記録
- `docs/20_NEXT_INSTRUCTIONS_FOR_CLAUDECODE_2026-03-19.md` ← ClaudeCode 向け次作業指示書
- `docs/21_IMPL_SPEC_FIELD_ACCESS_CONTROL_v106.md` ← v106 フィールドレベルアクセス制御拡張の実装仕様書
- `docs/22_TEST_SPEC_v106_FIELD_ACCESS_CONTROL.md` ← v106 テスト仕様書（バックエンド10項目+フロントエンド12項目+回帰10項目）
- `docs/23_MIGRATION_HANDOVER_v128.md` ← v128 名簿データ移行の引継ぎ・解析記録
- `docs/24_TABLE_DESIGN_MIGRATION_v128_REDO_2026-03-25.md` ← v128 再移行専用テーブル設計書
- `docs/25_SOW_MIGRATION_v128_REDO_2026-03-25.md` ← v128 再移行専用 SOW
- `docs/26_BROWSER_AUDIT_COLUMN_MAPPING_HANDOVER_2026-03-25.md` ← 2026-03-25 ブラウザ実機監査メモ（pre-repair の監査記録）
- `docs/27_IMPL_SPEC_ADMIN_DASHBOARD_AND_OFFICE_MEMBER_v131.md` ← v131 管理コンソール年度対応・事業所会員基本情報整理・入会日補正の実装仕様書
- `docs/28_UNKNOWN_JOINED_DATE_MEMBERS_v131.md` ← v131 入会日不明会員リスト（37件・手動確認用）
- `docs/29_IMPL_SPEC_INLINE_STAFF_EDIT_v136_v140.md` ← v136-v140 権限階層修正・インライン職員編集・サイレントリロードの実装仕様書
- `docs/30_TEST_SPEC_v136_v140_INLINE_STAFF_EDIT.md` ← v136-v140 テスト仕様書（権限3項目+インライン5項目+サイレントリロード4項目+初回読込2項目+ビルド3項目+デプロイ11項目+回帰11項目）

## 運用テンプレート
- `docs/31_HANDOVER_TASK_TEMPLATE.md` ← 引継ぎ task の書式テンプレート（現況の正本ではない）

## 進行中の引継ぎ task
- `docs/32_HANDOVER_TASK_v142_RETEST_AND_DEPLOYMENT_CONFIRM.md` ← v142 の残ケース 8 件再検証と fixed deployment 確認用 task

## 履歴資料（参照のみ）
- `docs/archive/docs_history/*`
- `docs/archive/obsolete/*`

## 補足資料（学習用・正本ではない）
- `docs/learning/index.html`
- `docs/learning/01_nodejs_and_npm.html`
- `docs/learning/02_nodejs_and_browser_javascript.html`
- `docs/learning/03_nodejs_in_this_project.html`
- `docs/learning/04_typescript_intro.html`
- `docs/learning/05_gas_browser_nodejs_relationship.html`
- `docs/learning/06_nodejs_npm_vite_relationship.html`

## 運用ルール
- 実装変更時は、正本ドキュメントを同時更新する。
- 旧版は archive へ退避し、現行文書と混在させない。
- 人間確認用の HTML は保持対象とし、削除しない。
- 旧グランドルール文書（`docs/12_ENGINEERING_RULEBOOK.md`, `docs/23_GLOBAL_GROUND_RULES.md`）は `Dust/` 退避対象とし、現行ルール参照には使わない。
