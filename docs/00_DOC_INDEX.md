# Document Index

更新日: 2026-05-09
現行バージョン: `v319`（admin @79 / member @44 / integrated-public @290）

## 1. Entry Points

| 文書 | 内容 |
|---|---|
| `HANDOVER.md` | 現行状態、最初に読む順序、直近リリース、確認待ち |
| `AGENTS.md` | AI / agent のグランドルール入口 |
| `GLOBAL_GROUND_RULES/docs/AI_RULES/05_PROJECT_RULES_HIRAKATA.md` | 案件固有ルール |
| `docs/44_DEVELOPMENT_HANDOVER_PLAYBOOK_2026-04-04.md` | 日次開発引継ぎ手順 |

## 2. Reference

| 文書 | 内容 |
|---|---|
| `docs/01_PRD.md` | 要件定義 |
| `docs/02_ARCHITECTURE.md` | システムアーキテクチャ |
| `docs/03_DATA_MODEL.md` | データモデル正本 |
| `docs/04_DB_OPERATION_RUNBOOK.md` | DB 運用手順 |
| `docs/05_AUTH_AND_ROLE_SPEC.md` | 認証・認可仕様 |
| `docs/09_DEPLOYMENT_POLICY.md` | デプロイポリシー正本 |
| `docs/39_IMPLEMENTATION_BEST_PRACTICES_2026-03-31.md` | 実装ベストプラクティス |
| `docs/109_THIRD_PARTY_ASSESSMENT_2026-04-20.md` | 第三者セキュリティ評価 |
| `docs/111_IMPLEMENTATION_BLUEPRINT_PROJECT_SPLIT_2026-04-20.md` | 3 プロジェクト分離設計 |
| `docs/170_HANDOVER_SECURITY_SEPARATION_NEXT_2026-04-29.md` | セキュリティ分離の次タスク |
| `docs/172_DEFERRED_SECURITY_BACKLOG_SECRET_MANAGER_KDF_2026-05-01.md` | Secret Manager / 外部 KDF backlog |

## 3. Current And Recent Work

| 文書 | 内容 |
|---|---|
| `docs/196_RELEASE_STATE_v311_to_v319_2026-05-09.md` | v311〜v319 統合リリース状態・第三者評価レポート。admin split `@71`〜`@79`。サイドバーリニューアル・設定サブナビ・テンプレートライブラリ・年会費多年度フィルター |
| `docs/195_RELEASE_STATE_v310_2026-05-08.md` | v310 リリース状態。宛名リスト年会費納入フィルターを複数年度AND条件ビルダーに刷新、admin split `@70` |
| `docs/194_RELEASE_STATE_v309_2026-05-08.md` | v309 リリース状態。年会費管理コンソールに管理者共有メモパネル追加、admin split `@69` |
| `docs/193_RELEASE_STATE_v308_2026-05-06.md` | v308 リリース状態。会員詳細年会費表示を 2024 年度以降、当年度から過去 4 年分へ修正、admin split `@68` 同期証跡 |
| `docs/192_RELEASE_STATE_v307_2026-05-06.md` | v307 リリース状態。会員詳細編集画面の年会費表示・編集追加、admin split `@67` 同期証跡 |
| `docs/191_ADMIN_MEMBER_DETAIL_ANNUAL_FEE_EDIT_2026-05-06.md` | 会員詳細編集画面の年会費表示・編集追加 |
| `docs/190_RELEASE_STATE_v306_2026-05-06.md` | v306 リリース状態。管理コンソール保存後再読込の `unsupported_action` fatal error 修正、admin split `@66` 同期証跡 |
| `docs/189_ADMIN_CONSOLE_REFRESH_UNSUPPORTED_ACTION_FIX_2026-05-05.md` | 管理コンソール保存後再読込の `unsupported_action` fatal error 原因・修正記録 |
| `docs/188_RELEASE_STATE_v305_2026-05-05.md` | v305 リリース状態。宛名リスト年度基準判定と共有検索修正、admin split `@65` 同期証跡 |
| `docs/187_MAILING_LIST_FISCAL_YEAR_FILTER_FIX_2026-05-05.md` | 宛名リスト年度基準判定と氏名検索共通化の実装記録 |
| `docs/186_RELEASE_STATE_v304_2026-05-05.md` | v304 リリース状態。会員管理コンソールの事業所職員一覧 UI 修正 |
| `docs/185_BUSINESS_STAFF_DIRECTORY_UI_FIX_2026-05-05.md` | 事業所職員一覧 UI / メール配信列 / 詳細戻り先修正 |
| `docs/184_RELEASE_STATE_v303_2026-05-04.md` | v303 リリース状態。旧 adminDashboard cache guard |
| `docs/183_RELEASE_STATE_v302_2026-05-04.md` | v302 リリース状態。事業所職員一覧の `staffRows` 表示 |
| `docs/182_RELEASE_STATE_v301_2026-05-04.md` | v301 リリース状態。admin artifact 再生成 |
| `docs/181_RELEASE_STATE_v300_2026-05-04.md` | v300 リリース状態。事業所職員一覧・一括編集 |
| `docs/180_RELEASE_STATE_v299_2026-05-04.md` | v299 リリース状態。事業所会員ビュー追加 |
| `docs/179_BUSINESS_MEMBER_DIRECTORY_VIEW_PHASE1_2026-05-04.md` | 事業所会員ビュー Phase 1 と v302 以降の補足 |
| `docs/178_RELEASE_STATE_v298_2026-05-04.md` | v298 リリース状態。振込口座管理の事業所職員役員対応 |
| `docs/177_RELEASE_STATE_v297_2026-05-04.md` | v297 リリース状態。事業所職員の役員割当て対応 |

古いリリース: `docs/archive/release_history/`

## 4. Operations

| 文書 | 内容 |
|---|---|
| `docs/16_INCIDENT_clasp_run_permission_2026-03-14.md` | `clasp run` 権限問題 |
| `docs/17_ROOT_CAUSE_ERROR_RESPONSE_PLAYBOOK.md` | 障害対応フロー |
| `docs/36_DATA_PROTECTION_PROCEDURES.md` | 個人情報保護手順 |
| `docs/37_GAS_QUOTAS_AND_LIMITS.md` | GAS クォータ |
| `docs/153_INCIDENT_DRIVE_PERMISSION_2026-04-27.md` | DriveApp / Google Drive API 権限インシデント |

## 5. Learning

| 文書 | 内容 |
|---|---|
| `docs/learning/index.html` | 学習コンテンツ一覧 |
| `docs/learning/11_system_overview_v269_2026-04-26.html` | システム全体概要 |
| `docs/learning/12_tech_stack_learning_2026-04-26.html` | 技術スタック学習資料 |
| `docs/learning/13_password_pepper_secret_management_2026-04-30.html` | password pepper と secret management |

## 6. Maintenance Rules

- 新しい正本文書を追加した場合は、この索引と `HANDOVER.md` を同ターンで更新する。
- release state は直近案件をこの索引へ掲載する。
- 文字化け、参照切れ、版ずれを見つけた場合は、作業完了前に修正する。
