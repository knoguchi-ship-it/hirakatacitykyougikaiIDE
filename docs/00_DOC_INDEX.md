# ドキュメント索引

> 2026-09-02 に全面整理した。**現役の文書だけを `docs/` 直下に置き、完了した記録は `docs/archive/` に移した**。
> 迷ったらこの索引の「①まず読む」から順に見ればよい。過去の記録を探すときは [アーカイブ索引](archive/00_ARCHIVE_INDEX.md)。

---

## ① まず読む（この 4 つで現状がわかる）

| 文書 | 何が書いてあるか |
|---|---|
| [`AGENTS.md`](../AGENTS.md)（リポジトリ直下） | **唯一のグランドルール入口**。シークレット規約・固定運用・完了条件。作業開始時は必ずここから |
| [`HANDOVER.md`](../HANDOVER.md)（リポジトリ直下） | **現時点の本番がどうなっているか / 次に何をすべきか**。本番バージョン・未完了タスク・既知の注意点 |
| [release-notes-2026.md](release-notes-2026.md) | **時系列のリリースログ**。いつ何が入ったかはここが正本 |
| [portal/test-report.html](portal/test-report.html) | **テスト結果レポート（HTML・人間向け）**。最新リリースの検証状況を一覧。再生成は `npm run report:tests` |

## ② 人間向け HTML（ブラウザで読む）

| 文書 | 内容 |
|---|---|
| [portal/index.html](portal/index.html) | ドキュメントポータルの入口（TOC） |
| [portal/test-report.html](portal/test-report.html) | テスト結果レポート（自動テスト＋dry-run＋本番実測を統合） |
| [portal/er-diagram.html](portal/er-diagram.html) | ER 図（`docs/03_DATA_MODEL.md` から自動生成） |
| [portal/tables.html](portal/tables.html) | テーブル設計書 |
| [portal/specifications.html](portal/specifications.html) | PRD / アーキテクチャ / 認証 / RBAC / デプロイのサマリ |
| [portal/er-editor.html](portal/er-editor.html) / [portal/interactive-er.html](portal/interactive-er.html) | ER エディタ（任意ツール） |
| [learning/index.html](learning/index.html) | 技術学習ノート（Node/TypeScript/GAS の関係など）。旧世代のシステム概要は `archive/learning_history/` |

## ③ 仕様・設計の正本

### ③-1 巻き直し中の新仕様書（`docs/spec/`・2026-09-03〜）

**5 文書がそろい、重複していた旧仕様書 6 本は `docs/archive/spec_history/` へ移した（2026-09-04）。**
旧文書に固有だった内容は、消さずに新仕様書の該当箇所へ移設済み。
仕様の正本はこの 5 文書だけで、役割で分けており、**同じ内容を 2 つの文書に書かない**。

| 文書 | 役割 | 状態 |
|---|---|---|
| [spec/01_SOW.md](spec/01_SOW.md) | 作業範囲・非機能の目標値 | 初版あり |
| [spec/02_RD.md](spec/02_RD.md) | 業務ルール・ユースケース | 初版あり |
| [spec/03_TRD.md](spec/03_TRD.md) | **技術構成・実装方式**（第1部 現行 GAS ／ 第2部 GCP 移行後） | **両部そろった（2026-09-03）** |
| [spec/04_UIUX.md](spec/04_UIUX.md) | **画面の一覧・遷移・表示条件・UI 規約** | 初版あり（2026-09-03）|
| [spec/05_DATA_IF.md](spec/05_DATA_IF.md) | **データ構造の規約と API 契約**（キー・型・削除・エンドポイント） | 初版あり（2026-09-03）|

**整合確認（`docs/267` §4）は 2026-09-04 に実施済み。**その成果物が次の一覧で、5 文書には含めない。

| 文書 | 役割 |
|---|---|
| [268_SPEC_TRACEABILITY_2026-09-04.md](268_SPEC_TRACEABILITY_2026-09-04.md) | **トレーサビリティ一覧**（要件ID → 検証方法 → 実装の所在）。要件を足したら同じターンでここにも 1 行足す |

### ③-1b 仕様書の作り方（次回以降の標準）

| 文書 | 内容 |
|---|---|
| [266_SPEC_AUTHORING_PROMPT_v3.md](266_SPEC_AUTHORING_PROMPT_v3.md) | **仕様書作成プロンプト v3.0**（Gem 本体の XML）。v2.0 からの変更理由つき |
| [267_SPEC_AUTHORING_TEMPLATE_v3.md](267_SPEC_AUTHORING_TEMPLATE_v3.md) | **要件定義・設計テンプレート v3.0**（知識ファイル）。正本マトリクス方式 |

### ③-2 個別機能の設計記録（現役）

新仕様書は「何を・なぜ」を書く。ここは**個別機能の設計判断の経緯**を残す文書で、役割が違うため重複しない。

| 文書 | 内容 |
|---|---|
| [03_DATA_MODEL.md](03_DATA_MODEL.md) | データモデル・ER（**ER ブロックは自動生成。手書き禁止**／AGENTS §4.6） |
| [06_DECISION_RECORDS.md](06_DECISION_RECORDS.md) | **決定記録 5 件を統合**（認証／公開ポータル／メールコンソール／年会費／申込統合） |
| [228_ROSTER_REDESIGN_2026-05-19.md](228_ROSTER_REDESIGN_2026-05-19.md) | 名簿出力の設計 |
| [246_DESIGN_MENU_BASED_CUSTOM_ROLES_RBAC_2026-05-28.md](246_DESIGN_MENU_BASED_CUSTOM_ROLES_RBAC_2026-05-28.md) | メニュー単位カスタムロール RBAC（全フェーズ完了） |
| [249_DESIGN_MEMBER_DELETE_CASCADE_ARCHIVE_2026-07-02.md](249_DESIGN_MEMBER_DELETE_CASCADE_ARCHIVE_2026-07-02.md) | 会員系削除の cascade アーカイブ |
| [251_DESIGN_LINE_POST_REQUEST_2026-05-21.md](251_DESIGN_LINE_POST_REQUEST_2026-05-21.md) | 公式 LINE 投稿依頼（旧 246。番号衝突のため 251 に改番） |

## ④ 運用・手順

| 文書 | 内容 |
|---|---|
| [09_DEPLOYMENT_POLICY.md](09_DEPLOYMENT_POLICY.md) | **デプロイ手順と fixed deployment の正本**。現行バージョンもここ |
| [04_DB_OPERATION_RUNBOOK.md](04_DB_OPERATION_RUNBOOK.md) | DB 操作手順 |
| [17_ROOT_CAUSE_ERROR_RESPONSE_PLAYBOOK.md](17_ROOT_CAUSE_ERROR_RESPONSE_PLAYBOOK.md) | 障害対応プレイブック |
| [36_DATA_PROTECTION_PROCEDURES.md](36_DATA_PROTECTION_PROCEDURES.md) | データ保護手順 |
| [37_GAS_QUOTAS_AND_LIMITS.md](37_GAS_QUOTAS_AND_LIMITS.md) | GAS クォータと制限 |
| [39_IMPLEMENTATION_BEST_PRACTICES_2026-03-31.md](39_IMPLEMENTATION_BEST_PRACTICES_2026-03-31.md) | 実装ベストプラクティス |
| [44_DEVELOPMENT_HANDOVER_PLAYBOOK_2026-04-04.md](44_DEVELOPMENT_HANDOVER_PLAYBOOK_2026-04-04.md) | 日次の開発引継ぎ運用 |
| [31_HANDOVER_TASK_TEMPLATE.md](31_HANDOVER_TASK_TEMPLATE.md) | 引継ぎタスクのテンプレート |
| [66_ROSTER_TEMPLATE_GUIDE_2026-04-10.md](66_ROSTER_TEMPLATE_GUIDE_2026-04-10.md) | 名簿テンプレート運用ガイド |
| [227_MAIL_KILL_SWITCH_2026-05-18.md](227_MAIL_KILL_SWITCH_2026-05-18.md) | メール送信キルスイッチ（4 階層ガード） |
| [ONBOARDING.md](ONBOARDING.md) | 新規参加者向けの導入 |

## ⑤ セキュリティ・第三者評価

| 文書 | 内容 |
|---|---|
| [171_PASSWORD_HASH_STANDARD_ALIGNMENT_2026-04-30.md](171_PASSWORD_HASH_STANDARD_ALIGNMENT_2026-04-30.md) | パスワードハッシュの標準整合 |
| [172_DEFERRED_SECURITY_BACKLOG_SECRET_MANAGER_KDF_2026-05-01.md](172_DEFERRED_SECURITY_BACKLOG_SECRET_MANAGER_KDF_2026-05-01.md) | **保留中だが破棄禁止のセキュリティ backlog**（AGENTS §4.3） |

## ⑥ 品質・テスト

| 文書 | 内容 |
|---|---|
| [portal/test-report.html](portal/test-report.html) | **テスト結果の実行記録（HTML）** |
| [255_MAIL_SETTINGS_TEST_PLAN_2026-09-02.md](255_MAIL_SETTINGS_TEST_PLAN_2026-09-02.md) | メール設定のテスト計画（旧 248。番号衝突のため 255 に改番） |
| [244_WCAG_2.2_AA_CONFORMANCE_STATEMENT_2026-05-21.md](244_WCAG_2.2_AA_CONFORMANCE_STATEMENT_2026-05-21.md) | WCAG 2.2 AA 適合声明 |
| [245_UI_ACCESSIBILITY_REGRESSION_CHECKLIST_2026-05-21.md](245_UI_ACCESSIBILITY_REGRESSION_CHECKLIST_2026-05-21.md) | UI アクセシビリティ回帰チェックリスト |

## ⑦ GCP 移行（進行中）

| 文書 | 内容 |
|---|---|
| [250_GCP_MIGRATION_PARALLEL_RUN_PLAN_2026-07-07.md](250_GCP_MIGRATION_PARALLEL_RUN_PLAN_2026-07-07.md) | **移行計画全体の正本**。§12 が実装入口 |
| [08_GCP_SETUP_RUNBOOK_2026-02-28.md](08_GCP_SETUP_RUNBOOK_2026-02-28.md) | GCP セットアップ手順 |
| [239_OPERATOR_GCP_SECRET_MANAGER_SETUP_2026-05-20.md](239_OPERATOR_GCP_SECRET_MANAGER_SETUP_2026-05-20.md) | Secret Manager の operator 手順（保留中タスク用） |
| [240_DESIGN_CLOUD_RUN_ARGON2ID_2026-05-20.md](240_DESIGN_CLOUD_RUN_ARGON2ID_2026-05-20.md) | Cloud Run Argon2id 設計 |

> GCP 側の実装状態・再開手順は **GCP 作業場 `C:\VSCode\CloudePL\hirakatacitykyougikaiGCP` の `README.md` と `docs/*` が正本**（AGENTS §4.7）。

## ⑧ 直近のリリース記録

| 文書 | 内容 |
|---|---|
| [260_SINGLE_SOURCE_AUDIT_2026-09-03.md](260_SINGLE_SOURCE_AUDIT_2026-09-03.md) | **単一情報源（DRY）棚卸し監査**（v376.67・実測ベース。正本レジストリは AGENTS §3） |
| [270_RELEASE_STATE_v376.73_2026-09-05.md](270_RELEASE_STATE_v376.73_2026-09-05.md) | **v376.73 入会申込フローの公開前是正（重大2・中3・軽微1）＋ カナ受理範囲の拡大** |
| [269_RELEASE_STATE_v376.72_2026-09-04.md](269_RELEASE_STATE_v376.72_2026-09-04.md) | v376.72 研修申込IDの採番統一（DRY 是正）＋ 仕様書 5 文書の整合確認 |
| [265_RELEASE_STATE_v376.71_2026-09-04.md](265_RELEASE_STATE_v376.71_2026-09-04.md) | v376.71 ログイン失敗の時限解除（セキュリティ改善）|

| [261_SPEC_CODE_DIFF_2026-09-03.md](261_SPEC_CODE_DIFF_2026-09-03.md) | **仕様書巻き直しの作業台帳**（仕様⇄コード差分 D-xx／不足情報とタスク G-xx。判定は operator 記入） |

> **これ以前のリリース記録は [`archive/release_history/`](archive/00_ARCHIVE_INDEX.md) に移した**（143 件）。
> 「いつ何が入ったか」は release-notes-2026.md を見れば足りる。個別の詳細が要るときだけアーカイブを開く。

---

## 運用ルール

- 新しいリリース記録を追加したら、**直近 3 件だけをこの索引に残し、古いものは `archive/release_history/` へ移す**。
- 一過性の記録（修正記録・インシデント・引継ぎスナップショット）は、完了した時点で `archive/` へ移す。
- 文書を移動したら、この索引と [アーカイブ索引](archive/00_ARCHIVE_INDEX.md) を同ターンで更新する（AGENTS §3 の同期則）。
- 文字コードは UTF-8 固定（AGENTS §3）。
