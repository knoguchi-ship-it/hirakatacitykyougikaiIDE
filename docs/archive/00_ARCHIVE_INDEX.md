# アーカイブ索引

> `docs/` から移した完了済みの記録。**削除はしていない**ので、過去の経緯はここで追える。
> 現役の文書は [ドキュメント索引](../00_DOC_INDEX.md) を見ること。

> 合計 **224 件**。

> 2026-09-04 追加: リリース記録 3 件（257 / 258 / 259 = v376.64〜.66）と、
> 完了した一過性の記録 7 件（109・167・248 第三者評価／110・230 是正計画／111 分離の実装準備／247 テスト観点評価）を
> それぞれ `release_history/` `historical/` へ移した。**docs 直下は 43 → 33 件**。

## 旧仕様書 — `spec_history/`（6 件）

2026-09-04 に仕様書を `docs/spec/` の 5 文書へ巻き直した際、**内容が重複するため現役から外した**もの。
固有だった内容は新仕様書へ移設済み。**新旧が食い違う場合は新仕様書が正**。

| 文書 | 現在の正本 |
|---|---|
| [01_PRD.md](spec_history/01_PRD.md) | `spec/01_SOW.md` ＋ `spec/02_RD.md` |
| [02_ARCHITECTURE.md](spec_history/02_ARCHITECTURE.md) | `spec/03_TRD.md` |
| [05_AUTH_AND_ROLE_SPEC.md](spec_history/05_AUTH_AND_ROLE_SPEC.md) | `spec/02_RD.md`（業務ルール）／`spec/03_TRD.md`（認証方式）／`spec/04_UIUX.md`（表示） |
| [10_SOW.md](spec_history/10_SOW.md) | `spec/01_SOW.md` |
| [11_WITHDRAWAL_DELETION_POLICY.md](spec_history/11_WITHDRAWAL_DELETION_POLICY.md) | `spec/02_RD.md` §10 |
| [63_SOW_ROSTER_PDF_AND_BULK_MAIL_2026-04-10.md](spec_history/63_SOW_ROSTER_PDF_AND_BULK_MAIL_2026-04-10.md) | `spec/01_SOW.md` ／ `spec/02_RD.md` ／ `spec/05_DATA_IF.md` |

## リリース記録 — `release_history/`（156 件・実測）

各リリースの詳細（バージョン・スコープ・検証・ロールバック先）。時系列の要約は `docs/release-notes-2026.md` にあるので、個別の詳細が要るときだけ開く。

| 新しいもの順 |
|---|
| [270_RELEASE_STATE_v376.73_2026-09-05.md](release_history/270_RELEASE_STATE_v376.73_2026-09-05.md) |
| [269_RELEASE_STATE_v376.72_2026-09-04.md](release_history/269_RELEASE_STATE_v376.72_2026-09-04.md) |
| [265_RELEASE_STATE_v376.71_2026-09-04.md](release_history/265_RELEASE_STATE_v376.71_2026-09-04.md) |
| [264_RELEASE_STATE_v376.70_2026-09-04.md](release_history/264_RELEASE_STATE_v376.70_2026-09-04.md) |
| [263_RELEASE_STATE_v376.69_2026-09-03.md](release_history/263_RELEASE_STATE_v376.69_2026-09-03.md) |
| [262_RELEASE_STATE_v376.68_2026-09-03.md](release_history/262_RELEASE_STATE_v376.68_2026-09-03.md) |
| [256_RELEASE_STATE_v376.63_2026-09-02.md](release_history/256_RELEASE_STATE_v376.63_2026-09-02.md) |
| [254_RELEASE_STATE_v376.62_2026-09-02.md](release_history/254_RELEASE_STATE_v376.62_2026-09-02.md) |
| [253_RELEASE_STATE_v376.61_2026-09-02.md](release_history/253_RELEASE_STATE_v376.61_2026-09-02.md) |
| [252_RELEASE_STATE_v376.60_2026-09-02.md](release_history/252_RELEASE_STATE_v376.60_2026-09-02.md) |
| [243_RELEASE_STATE_v373.7_ROSTER_S5_GAS_CLEANUP_2026-05-20.md](release_history/243_RELEASE_STATE_v373.7_ROSTER_S5_GAS_CLEANUP_2026-05-20.md) |
| [242_RELEASE_STATE_v373.6_ROSTER_S5_FRONTEND_CLEANUP_2026-05-20.md](release_history/242_RELEASE_STATE_v373.6_ROSTER_S5_FRONTEND_CLEANUP_2026-05-20.md) |
| [241_RELEASE_STATE_v373.5_SECRET_MANAGER_2026-05-20.md](release_history/241_RELEASE_STATE_v373.5_SECRET_MANAGER_2026-05-20.md) |
| [238_RELEASE_STATE_v373.4_ROSTER_ROW_FILTER_NOCODE_2026-05-20.md](release_history/238_RELEASE_STATE_v373.4_ROSTER_ROW_FILTER_NOCODE_2026-05-20.md) |
| [237_RELEASE_STATE_v373.3_ROSTER_STYLE_RULE_SIMPLIFY_2026-05-20.md](release_history/237_RELEASE_STATE_v373.3_ROSTER_STYLE_RULE_SIMPLIFY_2026-05-20.md) |
| [236_RELEASE_STATE_v373.2_ROSTER_UX_OVERHAUL_2026-05-20.md](release_history/236_RELEASE_STATE_v373.2_ROSTER_UX_OVERHAUL_2026-05-20.md) |
| [235_RELEASE_STATE_v373.1_ROSTER_S4_2026-05-20.md](release_history/235_RELEASE_STATE_v373.1_ROSTER_S4_2026-05-20.md) |
| [234_RELEASE_STATE_v373_ROSTER_S3_2026-05-20.md](release_history/234_RELEASE_STATE_v373_ROSTER_S3_2026-05-20.md) |
| [232_RELEASE_STATE_v372.9_ROSTER_S2_DRAG_DROP_2026-05-20.md](release_history/232_RELEASE_STATE_v372.9_ROSTER_S2_DRAG_DROP_2026-05-20.md) |
| [231_RELEASE_STATE_v372.8_ROSTER_S2_FORMAT_WIDTH_2026-05-20.md](release_history/231_RELEASE_STATE_v372.8_ROSTER_S2_FORMAT_WIDTH_2026-05-20.md) |
| [229_RELEASE_STATE_v372_to_v372.6.1_2026-05-20.md](release_history/229_RELEASE_STATE_v372_to_v372.6.1_2026-05-20.md) |
| [225_RELEASE_STATE_v360_to_v370_2026-05-17.md](release_history/225_RELEASE_STATE_v360_to_v370_2026-05-17.md) |
| … 他 131 件（`release_history/` を直接開く） |

## 完了した一過性の記録 — `historical/`（55 件）

個別バグ修正の記録・旧引継ぎスナップショット・完了したタスク計画・統合済みの決定記録の原本。

| 新しいもの順 |
|---|
| [233_HANDOVER_v372.9_NEXT_TASKS_2026-05-20.md](historical/233_HANDOVER_v372.9_NEXT_TASKS_2026-05-20.md) |
| [226_HANDOVER_DRYRUN_2026-05-17.md](historical/226_HANDOVER_DRYRUN_2026-05-17.md) |
| [208_MEMBER_STATUS_NOTE_2026-05-12.md](historical/208_MEMBER_STATUS_NOTE_2026-05-12.md) |
| [206_ADMIN_WORKPLACE_SEARCH_FIX_2026-05-12.md](historical/206_ADMIN_WORKPLACE_SEARCH_FIX_2026-05-12.md) |
| [198_RESPONSIVE_TEST_REPORT_2026-05-11.md](historical/198_RESPONSIVE_TEST_REPORT_2026-05-11.md) |
| [191_ADMIN_MEMBER_DETAIL_ANNUAL_FEE_EDIT_2026-05-06.md](historical/191_ADMIN_MEMBER_DETAIL_ANNUAL_FEE_EDIT_2026-05-06.md) |
| [189_ADMIN_CONSOLE_REFRESH_UNSUPPORTED_ACTION_FIX_2026-05-05.md](historical/189_ADMIN_CONSOLE_REFRESH_UNSUPPORTED_ACTION_FIX_2026-05-05.md) |
| [187_MAILING_LIST_FISCAL_YEAR_FILTER_FIX_2026-05-05.md](historical/187_MAILING_LIST_FISCAL_YEAR_FILTER_FIX_2026-05-05.md) |
| [185_BUSINESS_STAFF_DIRECTORY_UI_FIX_2026-05-05.md](historical/185_BUSINESS_STAFF_DIRECTORY_UI_FIX_2026-05-05.md) |
| [179_BUSINESS_MEMBER_DIRECTORY_VIEW_PHASE1_2026-05-04.md](historical/179_BUSINESS_MEMBER_DIRECTORY_VIEW_PHASE1_2026-05-04.md) |
| [170_HANDOVER_SECURITY_SEPARATION_NEXT_2026-04-29.md](historical/170_HANDOVER_SECURITY_SEPARATION_NEXT_2026-04-29.md) |
| [165_HANDOVER_PUBLIC_PORTAL_SEPARATION_PLAN_2026-04-28.md](historical/165_HANDOVER_PUBLIC_PORTAL_SEPARATION_PLAN_2026-04-28.md) |
| … 他 43 件（`historical/` を直接開く） |

## インシデント記録 — `incidents/`（3 件）

発生した障害と原因・恒久対策の記録。同種の障害が起きたときに参照する。

| 新しいもの順 |
|---|
| [204_INCIDENT_DB_SCHEMA_SHIFT_2026-05-12.md](incidents/204_INCIDENT_DB_SCHEMA_SHIFT_2026-05-12.md) |
| [153_INCIDENT_DRIVE_PERMISSION_2026-04-27.md](incidents/153_INCIDENT_DRIVE_PERMISSION_2026-04-27.md) |
| [16_INCIDENT_clasp_run_permission_2026-03-14.md](incidents/16_INCIDENT_clasp_run_permission_2026-03-14.md) |

## 旧世代の学習ノート — `learning_history/`（8 件）

システム概要・データモデルの旧バージョンのスナップショット（HTML）。最新版は `docs/learning/`。

| 新しいもの順 |
|---|
| [16_system_overview_v370_2026-05-17.html](learning_history/16_system_overview_v370_2026-05-17.html) |
| [15_system_overview_v360_2026-05-16.html](learning_history/15_system_overview_v360_2026-05-16.html) |
| [14_data_model_v360_2026-05-16.html](learning_history/14_data_model_v360_2026-05-16.html) |
| [11_system_overview_v269_2026-04-26.html](learning_history/11_system_overview_v269_2026-04-26.html) |
| [10_system_overview_v261_2026-04-24.html](learning_history/10_system_overview_v261_2026-04-24.html) |
| [09_performance_and_caching_v193.html](learning_history/09_performance_and_caching_v193.html) |
| [08_system_overview_v154.html](learning_history/08_system_overview_v154.html) |
| [07_system_overview_v151.html](learning_history/07_system_overview_v151.html) |

## 文書の履歴 — `docs_history/`（12 件）

過去の文書構成・版の記録。

| 新しいもの順 |
|---|
| [99_HANDOVER_2026-03-07_v38.md](docs_history/99_HANDOVER_2026-03-07_v38.md) |
| [99_HANDOVER_2026-03-07_v37.md](docs_history/99_HANDOVER_2026-03-07_v37.md) |
| [99_HANDOVER_2026-03-06_v29.md](docs_history/99_HANDOVER_2026-03-06_v29.md) |
| [99_HANDOVER_2026-03-06_v28.md](docs_history/99_HANDOVER_2026-03-06_v28.md) |
| [99_HANDOVER_2026-03-06_v26.md](docs_history/99_HANDOVER_2026-03-06_v26.md) |
| [99_HANDOVER_2026-03-06.md](docs_history/99_HANDOVER_2026-03-06.md) |
| [99_HANDOVER_2026-03-05.md](docs_history/99_HANDOVER_2026-03-05.md) |
| [99_HANDOVER_2026-03-01.md](docs_history/99_HANDOVER_2026-03-01.md) |
| [99_HANDOVER_2026-02-25.md](docs_history/99_HANDOVER_2026-02-25.md) |
| [98_DEV_RESTART_CHECKLIST_2026-03-05.md](docs_history/98_DEV_RESTART_CHECKLIST_2026-03-05.md) |
| [98_DEV_RESTART_CHECKLIST_2026-02-28_addendum.md](docs_history/98_DEV_RESTART_CHECKLIST_2026-02-28_addendum.md) |
| [98_DEV_RESTART_CHECKLIST_2026-02-28.md](docs_history/98_DEV_RESTART_CHECKLIST_2026-02-28.md) |

## 廃止 — `obsolete/`（3 件）

使われなくなった文書。

| 新しいもの順 |
|---|
| [118_TASK_COMPLETION_SCREEN_LOGIN_INFO_MESSAGE_2026-04-21.md](obsolete/118_TASK_COMPLETION_SCREEN_LOGIN_INFO_MESSAGE_2026-04-21.md) |
| [07_LOCAL_MOCK_TEST_REPORT_2026-02-28.md](obsolete/07_LOCAL_MOCK_TEST_REPORT_2026-02-28.md) |
| [04_ROADMAP.md](obsolete/04_ROADMAP.md) |
