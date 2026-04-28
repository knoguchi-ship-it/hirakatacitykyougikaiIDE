# Document Index

更新日: 2026-04-29
現行バージョン: `v289`

## 1. Entry Points

| 文書 | 内容 |
|---|---|
| `HANDOVER.md` | 現行本番、再開手順、直近状態 |
| `AGENTS.md` | AI / agent のグランドルール入口 |
| `GLOBAL_GROUND_RULES/docs/AI_RULES/05_PROJECT_RULES_HIRAKATA.md` | 案件固有ルール |
| `docs/44_DEVELOPMENT_HANDOVER_PLAYBOOK_2026-04-04.md` | 日次開発手順 |

## 2. Reference

| 文書 | 内容 |
|---|---|
| `docs/01_PRD.md` | 要件定義 |
| `docs/02_ARCHITECTURE.md` | システムアーキテクチャ |
| `docs/03_DATA_MODEL.md` | データモデル正本 |
| `docs/04_DB_OPERATION_RUNBOOK.md` | DB運用手順 |
| `docs/05_AUTH_AND_ROLE_SPEC.md` | 認証・認可仕様 |
| `docs/09_DEPLOYMENT_POLICY.md` | デプロイポリシー正本（v289 @288/@39/@46） |
| `docs/109_THIRD_PARTY_ASSESSMENT_2026-04-20.md` | 第三者セキュリティ評価 |
| `docs/111_IMPLEMENTATION_BLUEPRINT_PROJECT_SPLIT_2026-04-20.md` | 3プロジェクト分離設計 |
| `docs/165_HANDOVER_PUBLIC_PORTAL_SEPARATION_PLAN_2026-04-28.md` | public portal の Code.gs 完全分離に向けた次期引継ぎ・計画 |
| `docs/167_THIRD_PARTY_ASSESSMENT_PUBLIC_SEPARATION_2026-04-28.md` | v288 public separation 第三者評価（不合格 / v289 必須） |

## 3. Operations

| 文書 | 内容 |
|---|---|
| `docs/16_INCIDENT_clasp_run_permission_2026-03-14.md` | `clasp run` 権限問題 |
| `docs/17_ROOT_CAUSE_ERROR_RESPONSE_PLAYBOOK.md` | 障害対応フロー |
| `docs/36_DATA_PROTECTION_PROCEDURES.md` | 個人情報保護手順 |
| `docs/37_GAS_QUOTAS_AND_LIMITS.md` | GAS クォータ |
| `docs/153_INCIDENT_DRIVE_PERMISSION_2026-04-27.md` | DriveApp / Google Drive API 権限インシデント |

## 4. Current Release Records

| Version | 文書 | 内容 |
|---|---|---|
| **v289** | `docs/168_RELEASE_STATE_v289_2026-04-29.md` | public callable maintenance / diagnostic entrypoint を除去し、top-level callable allowlist を追加 |
| v288 | `docs/166_RELEASE_STATE_v288_2026-04-28.md` | 統合 project の public artifact を public-only に縮退。公開 URL / deployment ID は維持 |
| v287-partial | `docs/164_RELEASE_STATE_v287_2026-04-28.md` | member 物理削除は継続。admin 物理削除はホワイトアウトにより @46 へロールバック |
| v286 | `docs/163_RELEASE_STATE_v286_2026-04-28.md` | admin-only 代表者検証・監査ログを `saveMemberCore_` option で明示 |
| v285 | `docs/162_RELEASE_STATE_v285_2026-04-27.md` | member self-service 更新経路を admin wrapper から core へ分離 |

古いリリース: `docs/archive/release_history/`

## 5. Learning

| 文書 | 内容 |
|---|---|
| `docs/learning/index.html` | 学習コンテンツ一覧 |
| `docs/learning/11_system_overview_v269_2026-04-26.html` | システム全体概要（v269時点） |
| `docs/learning/12_tech_stack_learning_2026-04-26.html` | 技術スタック学習ドキュメント |

## 6. Maintenance Rules

- 新しい正本文書を追加したら、この索引と `HANDOVER.md` を同ターンで更新する。
- release state は直近5件をこの索引へ掲載する。
- 文字化け、参照切れ、版ずれを見つけた場合は作業完了前に修正する。
