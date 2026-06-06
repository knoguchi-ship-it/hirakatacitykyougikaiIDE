# Document Index

更新日: 2026-06-01
現行本番: **`v376.38`**（integrated-public `@356` x2 / member split `@115` / admin split `@197`）

このプロジェクトのドキュメントは **[Diátaxis フレームワーク](https://diataxis.fr/)** に従って 4 カテゴリ + 補助 2 カテゴリで構成しています。
**目的別に最短経路で必要な情報に到達できる**ことを保証しています。

| カテゴリ | 目的 | あなたの状況 |
|---|---|---|
| 🎯 [Tutorials](#-tutorials) | **学習** | 「このプロジェクトに新しく参加した」 |
| 📋 [How-to Guides](#-how-to-guides) | **タスク完遂** | 「特定の作業をする方法を知りたい」 |
| 📖 [Reference](#-reference) | **情報参照** | 「正確な仕様・スキーマ・API を確認したい」 |
| 💡 [Explanation](#-explanation) | **理解** | 「なぜこの設計・なぜこの判断なのか知りたい」 |
| 📜 [Recent Releases](#-recent-releases) | 時系列の変更履歴 | 「最近何が変わったか」 |
| 📦 [Archive](#-archive) | 過去の release-state | 「歴史的経緯を辿りたい」 |

---

## 🎯 Tutorials

学習指向。**手を動かしながら覚える**ためのドキュメント。

| 文書 | 対象 / 目的 |
|---|---|
| **[ONBOARDING.md](ONBOARDING.md)** | **新規開発者の最初の 4 週間** (Day 1 / Week 1 / Week 2-3 / Week 4) |
| [learning/index.html](learning/index.html) | 技術スタック学習教材（Node.js / GAS / TypeScript / Vite） |

---

## 📋 How-to Guides

タスク指向。**特定の作業を完遂する**ための手順書。

### 開発フロー

| 文書 | 内容 |
|---|---|
| [09_DEPLOYMENT_POLICY.md](09_DEPLOYMENT_POLICY.md) | 3 split 固定 deployment 運用 + clasp redeploy 標準手順 |
| [04_DB_OPERATION_RUNBOOK.md](04_DB_OPERATION_RUNBOOK.md) | DB スプレッドシート操作（schema 変更・データ migration） |
| [44_DEVELOPMENT_HANDOVER_PLAYBOOK_2026-04-04.md](44_DEVELOPMENT_HANDOVER_PLAYBOOK_2026-04-04.md) | 日次開発引継ぎ手順 |
| [31_HANDOVER_TASK_TEMPLATE.md](31_HANDOVER_TASK_TEMPLATE.md) | タスク引継ぎ用テンプレート |

### 品質・テスト

| 文書 | 内容 |
|---|---|
| [245_UI_ACCESSIBILITY_REGRESSION_CHECKLIST_2026-05-21.md](245_UI_ACCESSIBILITY_REGRESSION_CHECKLIST_2026-05-21.md) | 新 UI 追加時の必須チェック（a11y + responsive） |
| [247_TEST_VIEWPOINT_EVAL_2026-06-06.md](247_TEST_VIEWPOINT_EVAL_2026-06-06.md) | テスト観点表評価（v376.32〜.37・ISO/IEC 25010:2023 準拠・a11y/レスポンシブ/依存 実測） |
| [17_ROOT_CAUSE_ERROR_RESPONSE_PLAYBOOK.md](17_ROOT_CAUSE_ERROR_RESPONSE_PLAYBOOK.md) | 障害対応フロー（根本原因→修正→再発防止） |

### Operator (運用担当者) 向け

| 文書 | 内容 |
|---|---|
| [239_OPERATOR_GCP_SECRET_MANAGER_SETUP_2026-05-20.md](239_OPERATOR_GCP_SECRET_MANAGER_SETUP_2026-05-20.md) | GCP Secret Manager セットアップ 30 分手順（v373.5 関連、現状延期中） |
| [08_GCP_SETUP_RUNBOOK_2026-02-28.md](08_GCP_SETUP_RUNBOOK_2026-02-28.md) | GCP 初期セットアップ |
| [36_DATA_PROTECTION_PROCEDURES.md](36_DATA_PROTECTION_PROCEDURES.md) | データ保護手順 |
| [11_WITHDRAWAL_DELETION_POLICY.md](11_WITHDRAWAL_DELETION_POLICY.md) | 退会・削除ポリシー |

### インシデント対応

| 文書 | 内容 |
|---|---|
| [16_INCIDENT_clasp_run_permission_2026-03-14.md](16_INCIDENT_clasp_run_permission_2026-03-14.md) | clasp run 権限問題 |
| [153_INCIDENT_DRIVE_PERMISSION_2026-04-27.md](153_INCIDENT_DRIVE_PERMISSION_2026-04-27.md) | Drive 権限インシデント |
| [204_INCIDENT_DB_SCHEMA_SHIFT_2026-05-12.md](204_INCIDENT_DB_SCHEMA_SHIFT_2026-05-12.md) | DB schema-shift incident（復旧済み） |

---

## 📖 Reference

情報指向。**正確な仕様を確認する**ためのリファレンス。記述的・網羅的。

### 仕様 / アーキテクチャ

| 文書 | 内容 |
|---|---|
| [01_PRD.md](01_PRD.md) | 要件定義 |
| [02_ARCHITECTURE.md](02_ARCHITECTURE.md) | システムアーキテクチャ正本 |
| [03_DATA_MODEL.md](03_DATA_MODEL.md) | データモデル正本（ER 図 + バリデーション + バージョン履歴） |
| [05_AUTH_AND_ROLE_SPEC.md](05_AUTH_AND_ROLE_SPEC.md) | 認証・認可・5 段階権限仕様 |
| [10_SOW.md](10_SOW.md) | Statement of Work |
| [63_SOW_ROSTER_PDF_AND_BULK_MAIL_2026-04-10.md](63_SOW_ROSTER_PDF_AND_BULK_MAIL_2026-04-10.md) | 名簿 PDF + 一括メール SOW |
| [37_GAS_QUOTAS_AND_LIMITS.md](37_GAS_QUOTAS_AND_LIMITS.md) | GAS 制約一覧 |
| [../GLOBAL_GROUND_RULES/docs/AI_RULES/10_WORKFLOW_AND_QUALITY.md](../GLOBAL_GROUND_RULES/docs/AI_RULES/10_WORKFLOW_AND_QUALITY.md) | エンジニアリングルール最上位（旧 `docs/12_ENGINEERING_RULEBOOK.md` は commit `c572ed7` で `GLOBAL_GROUND_RULES/` へ移行・入口は `AGENTS.md`） |

### 適合・コンプライアンス

| 文書 | 内容 |
|---|---|
| [244_WCAG_2.2_AA_CONFORMANCE_STATEMENT_2026-05-21.md](244_WCAG_2.2_AA_CONFORMANCE_STATEMENT_2026-05-21.md) | WCAG 2.2 AA 適合声明 + Principle 1-4 全 SC 別評価表 |
| [198_RESPONSIVE_TEST_REPORT_2026-05-11.md](198_RESPONSIVE_TEST_REPORT_2026-05-11.md) | レスポンシブ自動テスト正本（Public 21 / Member 21 / Admin 56 セル合格） |

### 状態（現行）

| 文書 | 内容 |
|---|---|
| [../HANDOVER.md](../HANDOVER.md) | 現行本番状態 + 操作者タスク + 開発再開コマンド |
| [release-notes-2026.md](release-notes-2026.md) | 2026 年の release ログ（時系列） |

---

## 💡 Explanation

理解指向。**「なぜそうなっているか」を語る**ドキュメント。設計判断・トレードオフ・歴史。

### 設計書 / 判断記録 (ADR)

| 文書 | 判断対象 |
|---|---|
| [06_DECISION_RECORD_AUTH_2026-02-28.md](06_DECISION_RECORD_AUTH_2026-02-28.md) | 認証方式の判断 |
| [07_DECISION_RECORD_PUBLIC_PORTAL_2026-03-13.md](07_DECISION_RECORD_PUBLIC_PORTAL_2026-03-13.md) | 公開ポータル設計判断 |
| [13_DECISION_RECORD_MAIL_CONSOLE_2026-03-13.md](13_DECISION_RECORD_MAIL_CONSOLE_2026-03-13.md) | メールコンソール判断 |
| [18_DECISION_RECORD_ANNUAL_FEE_CONSOLE_2026-03-15.md](18_DECISION_RECORD_ANNUAL_FEE_CONSOLE_2026-03-15.md) | 年会費コンソール判断 |
| [19_DECISION_RECORD_PUBLIC_PORTAL_APPLICATION_INTEGRATION_2026-03-17.md](19_DECISION_RECORD_PUBLIC_PORTAL_APPLICATION_INTEGRATION_2026-03-17.md) | 公開ポータル + 入会申込統合 |
| [39_IMPLEMENTATION_BEST_PRACTICES_2026-03-31.md](39_IMPLEMENTATION_BEST_PRACTICES_2026-03-31.md) | 実装ベストプラクティス |

### 大規模設計書

| 文書 | 内容 |
|---|---|
| [111_IMPLEMENTATION_BLUEPRINT_PROJECT_SPLIT_2026-04-20.md](111_IMPLEMENTATION_BLUEPRINT_PROJECT_SPLIT_2026-04-20.md) | 3 プロジェクト分離設計 |
| [228_ROSTER_REDESIGN_2026-05-19.md](228_ROSTER_REDESIGN_2026-05-19.md) | 名簿出力 Visual Designer 全面刷新設計（Sprint S1-S5、完了） |
| [240_DESIGN_CLOUD_RUN_ARGON2ID_2026-05-20.md](240_DESIGN_CLOUD_RUN_ARGON2ID_2026-05-20.md) | Cloud Run Argon2id 外部 KDF 完全設計 + 実装雛形（GCP 利用判断時に反映） |
| [227_MAIL_KILL_SWITCH_2026-05-18.md](227_MAIL_KILL_SWITCH_2026-05-18.md) | メール送信 4 階層ガード設計 |
| [246_DESIGN_MENU_BASED_CUSTOM_ROLES_RBAC_2026-05-28.md](246_DESIGN_MENU_BASED_CUSTOM_ROLES_RBAC_2026-05-28.md) | メニュー単位カスタムロール RBAC 設計（固定5ロール→マスター定義のカスタムロール。Phase1-3） |

### 第三者評価 / セキュリティ

| 文書 | 内容 |
|---|---|
| [109_THIRD_PARTY_ASSESSMENT_2026-04-20.md](109_THIRD_PARTY_ASSESSMENT_2026-04-20.md) | 第三者セキュリティ評価 (D / High Risk → v261-v263 で是正) |
| [167_THIRD_PARTY_ASSESSMENT_PUBLIC_SEPARATION_2026-04-28.md](167_THIRD_PARTY_ASSESSMENT_PUBLIC_SEPARATION_2026-04-28.md) | 公開ポータル分離評価 (v288 不合格 → v289 で是正) |
| [171_PASSWORD_HASH_STANDARD_ALIGNMENT_2026-04-30.md](171_PASSWORD_HASH_STANDARD_ALIGNMENT_2026-04-30.md) | PBKDF2 移行の標準整合 |
| [172_DEFERRED_SECURITY_BACKLOG_SECRET_MANAGER_KDF_2026-05-01.md](172_DEFERRED_SECURITY_BACKLOG_SECRET_MANAGER_KDF_2026-05-01.md) | **必須・破棄禁止 backlog**（Secret Manager + 外部 KDF）|
| [170_HANDOVER_SECURITY_SEPARATION_NEXT_2026-04-29.md](170_HANDOVER_SECURITY_SEPARATION_NEXT_2026-04-29.md) | セキュリティ分離の次タスク |
| [230_SECURITY_REMEDIATION_DRIVE_PROXY_ALLOWLIST_2026-05-20.md](230_SECURITY_REMEDIATION_DRIVE_PROXY_ALLOWLIST_2026-05-20.md) | Drive proxy allowlist 是正（v372.7） |
| [110_REMEDIATION_PLAN_PORTAL_URL_AND_AUTH_2026-04-20.md](110_REMEDIATION_PLAN_PORTAL_URL_AND_AUTH_2026-04-20.md) | ポータル URL + 認証是正計画 |

### 大規模 release state（複数バージョン統合）

| 文書 | 期間 |
|---|---|
| [243_RELEASE_STATE_v373.7_ROSTER_S5_GAS_CLEANUP_2026-05-20.md](243_RELEASE_STATE_v373.7_ROSTER_S5_GAS_CLEANUP_2026-05-20.md) | Sprint S5 完了 |
| [242_RELEASE_STATE_v373.6_ROSTER_S5_FRONTEND_CLEANUP_2026-05-20.md](242_RELEASE_STATE_v373.6_ROSTER_S5_FRONTEND_CLEANUP_2026-05-20.md) | Sprint S5 第 1 弾 |
| [241_RELEASE_STATE_v373.5_SECRET_MANAGER_2026-05-20.md](241_RELEASE_STATE_v373.5_SECRET_MANAGER_2026-05-20.md) | Secret Manager 連携 |
| [229_RELEASE_STATE_v372_to_v372.6.1_2026-05-20.md](229_RELEASE_STATE_v372_to_v372.6.1_2026-05-20.md) | v372〜v372.6.1 統合 |
| [225_RELEASE_STATE_v360_to_v370_2026-05-17.md](225_RELEASE_STATE_v360_to_v370_2026-05-17.md) | v360〜v370 統合 |
| [199_RELEASE_STATE_v320_to_v332_2026-05-11.md](199_RELEASE_STATE_v320_to_v332_2026-05-11.md) | v320〜v332 統合（モバイル + WCAG 全面強化） |
| [196_RELEASE_STATE_v311_to_v319_2026-05-09.md](196_RELEASE_STATE_v311_to_v319_2026-05-09.md) | v311〜v319 統合 |

---

## 📜 Recent Releases

直近の単発 release-state。**[`docs/release-notes-2026.md`](release-notes-2026.md) の方が時系列で見やすい。**

古い release-state は `archive/release_history/` へ移動済み（2026-05-21 整理時）。
ここには v360 以降の現役相当のみ残しています。

| 文書 | バージョン |
|---|---|
| [245_UI_ACCESSIBILITY_REGRESSION_CHECKLIST_2026-05-21.md](245_UI_ACCESSIBILITY_REGRESSION_CHECKLIST_2026-05-21.md) | v374 チェックリスト |
| [244_WCAG_2.2_AA_CONFORMANCE_STATEMENT_2026-05-21.md](244_WCAG_2.2_AA_CONFORMANCE_STATEMENT_2026-05-21.md) | v374 conformance |
| [243_RELEASE_STATE_v373.7_ROSTER_S5_GAS_CLEANUP_2026-05-20.md](243_RELEASE_STATE_v373.7_ROSTER_S5_GAS_CLEANUP_2026-05-20.md) | v373.7 |
| [242_RELEASE_STATE_v373.6_ROSTER_S5_FRONTEND_CLEANUP_2026-05-20.md](242_RELEASE_STATE_v373.6_ROSTER_S5_FRONTEND_CLEANUP_2026-05-20.md) | v373.6 |
| [241_RELEASE_STATE_v373.5_SECRET_MANAGER_2026-05-20.md](241_RELEASE_STATE_v373.5_SECRET_MANAGER_2026-05-20.md) | v373.5 |
| [240_DESIGN_CLOUD_RUN_ARGON2ID_2026-05-20.md](240_DESIGN_CLOUD_RUN_ARGON2ID_2026-05-20.md) | (設計書) |
| [239_OPERATOR_GCP_SECRET_MANAGER_SETUP_2026-05-20.md](239_OPERATOR_GCP_SECRET_MANAGER_SETUP_2026-05-20.md) | (operator 手順) |
| [238_RELEASE_STATE_v373.4_ROSTER_ROW_FILTER_NOCODE_2026-05-20.md](238_RELEASE_STATE_v373.4_ROSTER_ROW_FILTER_NOCODE_2026-05-20.md) | v373.4 |
| [237_RELEASE_STATE_v373.3_ROSTER_STYLE_RULE_SIMPLIFY_2026-05-20.md](237_RELEASE_STATE_v373.3_ROSTER_STYLE_RULE_SIMPLIFY_2026-05-20.md) | v373.3 |
| [236_RELEASE_STATE_v373.2_ROSTER_UX_OVERHAUL_2026-05-20.md](236_RELEASE_STATE_v373.2_ROSTER_UX_OVERHAUL_2026-05-20.md) | v373.2 |
| [235_RELEASE_STATE_v373.1_ROSTER_S4_2026-05-20.md](235_RELEASE_STATE_v373.1_ROSTER_S4_2026-05-20.md) | v373.1 |
| [234_RELEASE_STATE_v373_ROSTER_S3_2026-05-20.md](234_RELEASE_STATE_v373_ROSTER_S3_2026-05-20.md) | v373 |
| [233_HANDOVER_v372.9_NEXT_TASKS_2026-05-20.md](233_HANDOVER_v372.9_NEXT_TASKS_2026-05-20.md) | v372.9 引継ぎ |
| [232_RELEASE_STATE_v372.9_ROSTER_S2_DRAG_DROP_2026-05-20.md](232_RELEASE_STATE_v372.9_ROSTER_S2_DRAG_DROP_2026-05-20.md) | v372.9 |
| [231_RELEASE_STATE_v372.8_ROSTER_S2_FORMAT_WIDTH_2026-05-20.md](231_RELEASE_STATE_v372.8_ROSTER_S2_FORMAT_WIDTH_2026-05-20.md) | v372.8 |
| [230_SECURITY_REMEDIATION_DRIVE_PROXY_ALLOWLIST_2026-05-20.md](230_SECURITY_REMEDIATION_DRIVE_PROXY_ALLOWLIST_2026-05-20.md) | v372.7（セキュリティ是正）|
| [229_RELEASE_STATE_v372_to_v372.6.1_2026-05-20.md](229_RELEASE_STATE_v372_to_v372.6.1_2026-05-20.md) | v372〜v372.6.1 統合 |
| [228_ROSTER_REDESIGN_2026-05-19.md](228_ROSTER_REDESIGN_2026-05-19.md) | (設計書、名簿出力刷新) |
| [227_MAIL_KILL_SWITCH_2026-05-18.md](227_MAIL_KILL_SWITCH_2026-05-18.md) | (設計書、メール送信制御) |
| [226_HANDOVER_DRYRUN_2026-05-17.md](226_HANDOVER_DRYRUN_2026-05-17.md) | dryRun フレームワーク |
| [225_RELEASE_STATE_v360_to_v370_2026-05-17.md](225_RELEASE_STATE_v360_to_v370_2026-05-17.md) | v360〜v370 統合 |
| [223_RELEASE_STATE_v360_2026-05-16.md](223_RELEASE_STATE_v360_2026-05-16.md) | v360 |
| [221_RELEASE_STATE_v354_to_v358_2026-05-16.md](221_RELEASE_STATE_v354_to_v358_2026-05-16.md) | v354〜v358 統合 |

---

## 📦 Archive

過去の release-state や歴史的経緯は以下に保管:

| ディレクトリ | 内容 |
|---|---|
| [archive/release_history/](archive/release_history/) | v200 以下の release-state（経緯資料） |
| [archive/docs_history/](archive/docs_history/) | 文書改訂履歴 |
| [archive/historical/](archive/historical/) | 古い指示書・引継ぎ書 |
| [archive/obsolete/](archive/obsolete/) | 廃止された設計書 |

詳細な v200 〜 v280 系 release-state は順次 `archive/release_history/` へ移動を進めています（Phase 3 で実施）。

---

## 🔑 各文書の役割（最後に）

| 役割 | ファイル |
|---|---|
| 🥇 **最初の入口** | `AGENTS.md` |
| 🥈 **現状把握** | `../HANDOVER.md`（本ファイルから 1 つ上） |
| 🥉 **新規参加者** | `ONBOARDING.md` |
| 📚 **全索引** | 本ファイル `docs/00_DOC_INDEX.md` |
| 📅 **時系列ログ** | `docs/release-notes-2026.md` |

**ドキュメント体系は Diátaxis フレームワーク (2026 標準) に従って 2026-05-21 に刷新済み。** 新規ファイル追加時は本書の正しいカテゴリへ追記してください。
