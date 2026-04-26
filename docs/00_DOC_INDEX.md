# Document Index

更新日: 2026-04-26
現行バージョン: v269

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
| Learning | 人が読む用・学習用ドキュメント（HTML） |
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

| 文書 | 内容 | 最終更新 |
|---|---|---|
| `docs/01_PRD.md` | 要件定義書 | 2026-04-26 |
| `docs/10_SOW.md` | スコープ | 2026-04-20 |
| `docs/02_ARCHITECTURE.md` | システムアーキテクチャ（3プロジェクト分離構成） | 2026-04-20 |
| `docs/03_DATA_MODEL.md` | **データモデル正本**（T_変更申請含む v264〜） | 2026-04-25 |
| `docs/05_AUTH_AND_ROLE_SPEC.md` | 認証・認可・5段階権限・CM番号編集ポリシー | 2026-04-24 |
| `docs/11_WITHDRAWAL_DELETION_POLICY.md` | 退会・削除ポリシー | 2026-04-20 |

### プラットフォーム・デプロイ

| 文書 | 内容 | 最終更新 |
|---|---|---|
| `docs/04_DB_OPERATION_RUNBOOK.md` | DB運用手順 | 2026-04-20 |
| `docs/08_GCP_SETUP_RUNBOOK_2026-02-28.md` | GCP初期構築 | 2026-02-28 |
| `docs/09_DEPLOYMENT_POLICY.md` | **デプロイポリシー正本**（v269 @272/@25/@31） | 2026-04-26 |

### 決定記録・評価

| 文書 | 内容 |
|---|---|
| `docs/06_DECISION_RECORD_AUTH_2026-02-28.md` | 認証方式決定 |
| `docs/07_DECISION_RECORD_PUBLIC_PORTAL_2026-03-13.md` | 公開ポータル設計 |
| `docs/13_DECISION_RECORD_MAIL_CONSOLE_2026-03-13.md` | メールコンソール |
| `docs/18_DECISION_RECORD_ANNUAL_FEE_CONSOLE_2026-03-15.md` | 年会費コンソール |
| `docs/19_DECISION_RECORD_PUBLIC_PORTAL_APPLICATION_INTEGRATION_2026-03-17.md` | 公開申込統合 |
| `docs/109_THIRD_PARTY_ASSESSMENT_2026-04-20.md` | 第三者セキュリティ評価（全タスク v263 完了済み） |
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
| 📋 Backlog | `docs/58_NEXT_TASK_PERFORMANCE_2026-04-09.md` | パフォーマンス改善 |

---

## 6. Current Release Records（直近5バージョン）

| バージョン | 文書 | 内容 |
|---|---|---|
| **v269** | `docs/151_RELEASE_STATE_v269_2026-04-26.md` | **現行本番**。データ管理コンソール 論理削除フィルタ追加 |
| v268 | `docs/149_RELEASE_STATE_v268_2026-04-26.md` | メール送信スコープエラー修正（Session.getEffectiveUser） |
| v267 | `docs/147_RELEASE_STATE_v267_2026-04-26.md` | 公開ポータル ヒーロー FOIC 修正 |
| v266 | `docs/145_RELEASE_STATE_v266_2026-04-25.md` | 入会・登録メール設定UI統合再設計 |
| v265 | `docs/143_RELEASE_STATE_v265_2026-04-25.md` | 事業所メール代表者/メンバー分離・職員追加承認時メール |

それより古いリリース: `docs/archive/release_history/`

---

## 7. Learning（人が読む用 / 学習用）

`docs/learning/` ディレクトリに HTML 形式で格納。正本ではなく参照専用。

| ファイル | 内容 |
|---|---|
| `docs/learning/index.html` | 学習コンテンツ一覧 |
| `docs/learning/11_system_overview_v269_2026-04-26.html` | **最新** システム全体概要・運営者向けガイド（v269） |
| `docs/learning/12_tech_stack_learning_2026-04-26.html` | **最新** 技術スタック学習ドキュメント（開発者向け） |
| `docs/learning/10_system_overview_v261_2026-04-24.html` | システム概要 v261（参照用） |
| `docs/learning/09_performance_and_caching_v193.html` | パフォーマンス・キャッシュ解説 |
| `docs/learning/01〜08_*.html` | Node.js / TypeScript / GAS 基礎学習シリーズ |

---

## 8. Archive

| ディレクトリ | 内容 |
|---|---|
| `docs/archive/release_history/` | 直近5バージョンより古いリリース記録（v264以前） |
| `docs/archive/historical/` | 完了済みタスク個票・過去handover |
| `docs/archive/obsolete/` | 未採用・後続タスクで置換済みの文書 |

---

## 9. 配置ルール

- `docs/` ルートには「正本」「運用手順」「進行中タスク」「直近5バージョンのリリース記録」のみ置く。
- 完了済みタスクは `docs/archive/historical/` へ移す。
- 未採用・置換済みは `docs/archive/obsolete/` へ移す。
- リリース記録は直近5バージョンを超えたら `docs/archive/release_history/` へ移す。
- 新しい文書を追加したら、この索引と `HANDOVER.md` の両方を同ターンで更新する。
- HTML 学習ドキュメントは `docs/learning/` に格納し、このインデックスに追記する。
