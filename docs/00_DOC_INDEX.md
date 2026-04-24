# Document Index

更新日: 2026-04-24
現行バージョン: v261-patch

---

## 1. 構成方針

[Diátaxis](https://diataxis.fr/) と GitHub Docs content model に準拠した **読者の目的別** 分類。

| 区分 | 目的 |
|---|---|
| Entry points | 再開・運用開始時に最初に読む |
| Reference | 現行仕様の正本 |
| How-to / Operations | 手順・運用・障害対応 |
| Active tasks | 未完了の実装計画 |
| Release records | 直近5バージョンの本番反映記録 |
| Archive | 完了済み・置換済み・古い履歴 |

---

## 2. Entry Points

| 文書 | 説明 |
|---|---|
| `HANDOVER.md` | 最優先。現行本番状態・次タスク・再開手順 |
| `AGENTS.md` | AI/エージェントのグランドルール |
| `GLOBAL_GROUND_RULES/docs/AI_RULES/05_PROJECT_RULES_HIRAKATA.md` | 本案件固有ルール |
| `GLOBAL_GROUND_RULES/docs/AI_RULES/00_OPERATING_MODEL.md` | AI行動原則 |
| `docs/44_DEVELOPMENT_HANDOVER_PLAYBOOK_2026-04-04.md` | 日次開発手順 |

---

## 3. Reference（正本）

### プロダクト・アーキテクチャ

| 文書 | 内容 |
|---|---|
| `docs/01_PRD.md` | 要件定義書 |
| `docs/10_SOW.md` | スコープ |
| `docs/02_ARCHITECTURE.md` | システムアーキテクチャ（3プロジェクト分離構成） |
| `docs/03_DATA_MODEL.md` | **データモデル正本**（Mermaid ER図含む・v261更新済み） |
| `docs/05_AUTH_AND_ROLE_SPEC.md` | 認証・認可・5段階権限 |
| `docs/11_WITHDRAWAL_DELETION_POLICY.md` | 退会・削除ポリシー |

### プラットフォーム・デプロイ

| 文書 | 内容 |
|---|---|
| `docs/04_DB_OPERATION_RUNBOOK.md` | DB運用手順 |
| `docs/08_GCP_SETUP_RUNBOOK_2026-02-28.md` | GCP初期構築 |
| `docs/09_DEPLOYMENT_POLICY.md` | **デプロイポリシー正本**（固定Deployment 2本運用） |

### 決定記録・評価

| 文書 | 内容 |
|---|---|
| `docs/06_DECISION_RECORD_AUTH_2026-02-28.md` | 認証方式決定 |
| `docs/07_DECISION_RECORD_PUBLIC_PORTAL_2026-03-13.md` | 公開ポータル設計 |
| `docs/13_DECISION_RECORD_MAIL_CONSOLE_2026-03-13.md` | メールコンソール |
| `docs/18_DECISION_RECORD_ANNUAL_FEE_CONSOLE_2026-03-15.md` | 年会費コンソール |
| `docs/19_DECISION_RECORD_PUBLIC_PORTAL_APPLICATION_INTEGRATION_2026-03-17.md` | 公開申込統合 |
| `docs/109_THIRD_PARTY_ASSESSMENT_2026-04-20.md` | 第三者セキュリティ評価 |
| `docs/110_REMEDIATION_PLAN_PORTAL_URL_AND_AUTH_2026-04-20.md` | セキュリティ是正計画 |
| `docs/111_IMPLEMENTATION_BLUEPRINT_PROJECT_SPLIT_2026-04-20.md` | 3プロジェクト分離設計 |

---

## 4. How-To / Operations

| 文書 | 内容 |
|---|---|
| `docs/44_DEVELOPMENT_HANDOVER_PLAYBOOK_2026-04-04.md` | 日次開発手順・clasp標準操作 |
| `docs/17_ROOT_CAUSE_ERROR_RESPONSE_PLAYBOOK.md` | 障害対応フロー |
| `docs/16_INCIDENT_clasp_run_permission_2026-03-14.md` | `clasp run` 権限障害・解決策 |
| `docs/36_DATA_PROTECTION_PROCEDURES.md` | 個人情報保護手順 |
| `docs/37_GAS_QUOTAS_AND_LIMITS.md` | GASクォータ制限 |
| `docs/39_IMPLEMENTATION_BEST_PRACTICES_2026-03-31.md` | 実装ベストプラクティス |
| `docs/63_SOW_ROSTER_PDF_AND_BULK_MAIL_2026-04-10.md` | 名簿PDF・一括メール |
| `docs/66_ROSTER_TEMPLATE_GUIDE_2026-04-10.md` | 名簿テンプレートガイド |
| `docs/31_HANDOVER_TASK_TEMPLATE.md` | 引継ぎタスクテンプレート |

---

## 5. Active Tasks（未完了）

| 優先度 | 文書 | 内容 |
|---|---|---|
| 🔴 Critical | `docs/120_TASK_SECURITY_DENY_BY_DEFAULT_2026-04-21.md` | processApiRequest deny-by-default |
| 🔴 Critical | `docs/121_TASK_SECURITY_IDOR_FIX_2026-04-21.md` | 自己操作API IDOR修正 |
| 🟠 High | `docs/122_TASK_SECURITY_PASSWORD_HASHING_2026-04-21.md` | パスワードハッシュPBKDF2移行 |
| 🟡 Medium | `docs/123_TASK_SECURITY_SCOPE_AND_CI_2026-04-21.md` | OAuthスコープ最小化・CI |
| 🟡 Medium | `docs/113_TASK_CM_NUMBER_EDIT_POLICY_2026-04-20.md` | CM番号編集ポリシー |
| 📋 Backlog | `docs/58_NEXT_TASK_PERFORMANCE_2026-04-09.md` | パフォーマンス改善 |

---

## 6. Current Release Records（直近5バージョン）

| バージョン | 文書 | 内容 |
|---|---|---|
| v261-patch | `docs/135_RELEASE_STATE_v261_2026-04-23.md` | **現行本番**。ログSS分離・archive・UIバグ修正 |
| v260 | `docs/133_RELEASE_STATE_v260_2026-04-22.md` | 公開ポータル変更・退会OTPフロー |
| v259 | `docs/131_RELEASE_STATE_v259_2026-04-22.md` | 入会通知メール送信元設定化 |
| v258 | `docs/129_RELEASE_STATE_v258_2026-04-22.md` | 事業所番号バリデーション・論理削除化 |
| v257 | `docs/127_RELEASE_STATE_v257_2026-04-21.md` | システム設定画面再編 |

それより古いリリース: `docs/archive/release_history/`

---

## 7. Archive

| ディレクトリ | 内容 |
|---|---|
| `docs/archive/release_history/` | 直近5バージョンより古いリリース記録 |
| `docs/archive/historical/` | 完了済みタスク個票・過去handover |
| `docs/archive/obsolete/` | 未採用・後続タスクで置換済みの文書 |
| `docs/learning/` | 参照専用（正本ではない）。システム概要・学習用 |

---

## 8. 配置ルール

- `docs/` ルートには「正本」「運用手順」「進行中タスク」「直近5バージョンのリリース記録」のみ置く。
- 完了済みタスクは `docs/archive/historical/` へ移す。
- 未採用・置換済みは `docs/archive/obsolete/` へ移す。
- リリース記録は直近5バージョンを超えたら `docs/archive/release_history/` へ移す。
- 新しい文書を追加したら、この索引と `HANDOVER.md` の両方を同ターンで更新する。
