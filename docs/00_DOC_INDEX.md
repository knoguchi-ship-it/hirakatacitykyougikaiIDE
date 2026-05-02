# Document Index

更新日: 2026-05-03
現行バージョン: `v294`

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
| `docs/09_DEPLOYMENT_POLICY.md` | デプロイポリシー正本（v294 @290/@40/@51） |
| `docs/109_THIRD_PARTY_ASSESSMENT_2026-04-20.md` | 第三者セキュリティ評価 |
| `docs/111_IMPLEMENTATION_BLUEPRINT_PROJECT_SPLIT_2026-04-20.md` | 3プロジェクト分離設計 |
| `docs/165_HANDOVER_PUBLIC_PORTAL_SEPARATION_PLAN_2026-04-28.md` | public portal の Code.gs 完全分離に向けた次期引継ぎ・計画 |
| `docs/167_THIRD_PARTY_ASSESSMENT_PUBLIC_SEPARATION_2026-04-28.md` | v288 public separation 第三者評価（不合格 / v289 必須） |
| `docs/170_HANDOVER_SECURITY_SEPARATION_NEXT_2026-04-29.md` | セキュリティ分離の次担当者向け引継ぎ（残タスク含む） |
| `docs/171_PASSWORD_HASH_STANDARD_ALIGNMENT_2026-04-30.md` | パスワードハッシュ標準整合、pepper 運用、残る外部 KDF / 認証基盤課題 |
| `docs/172_DEFERRED_SECURITY_BACKLOG_SECRET_MANAGER_KDF_2026-05-01.md` | Secret Manager 化・外部 KDF / managed identity 検討の保留中必須 backlog |
| `docs/173_RELEASE_STATE_v291_2026-05-01.md` | v291 リリース状態、pepper 設定、宛名リスト選択 UI/API、固定 deployment 同期証跡 |
| `docs/175_RELEASE_STATE_v293_2026-05-03.md` | v293 リリース状態、宛名リスト5列フィルター、admin split `@50` 同期証跡 |
| `docs/176_RELEASE_STATE_v294_2026-05-03.md` | v294 リリース状態、宛名リスト表示文言・初期未選択・選択ボタン調整、admin split `@51` 同期証跡 |

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
| **v294** | `docs/176_RELEASE_STATE_v294_2026-05-03.md` | 宛名リスト表示文言・初期未選択・選択ボタン調整を admin split `@51` へ同期 |
| v293 | `docs/175_RELEASE_STATE_v293_2026-05-03.md` | 宛名リスト5列フィルターを admin split `@50` へ同期 |
| v292 | `docs/174_RELEASE_STATE_v292_2026-05-01.md` | build pruning 正規表現バグ修正（管理者ログイン不能・404 解消）。admin split `@49` へ同期 |
| v291 | `docs/173_RELEASE_STATE_v291_2026-05-01.md` | password hash pepper hardening、宛名リスト候補選択 UI/API、split boundary gate を本番反映 |
| v290 | `docs/169_RELEASE_STATE_v290_2026-04-29.md` | public artifact から admin private helper と maintenance token を追加削除 |

古いリリース: `docs/archive/release_history/`

## 5. Learning

| 文書 | 内容 |
|---|---|
| `docs/learning/index.html` | 学習コンテンツ一覧 |
| `docs/learning/11_system_overview_v269_2026-04-26.html` | システム全体概要（v269時点） |
| `docs/learning/12_tech_stack_learning_2026-04-26.html` | 技術スタック学習ドキュメント |
| `docs/learning/13_password_pepper_secret_management_2026-04-30.html` | パスワード pepper と Script Properties / Secret Manager / 外部 KDF の比較学習資料 |

## 6. Maintenance Rules

- 新しい正本文書を追加したら、この索引と `HANDOVER.md` を同ターンで更新する。
- release state は直近5件をこの索引へ掲載する。
- 文字化け、参照切れ、版ずれを見つけた場合は作業完了前に修正する。
