# Release Notes 2026

このファイルは **時系列の release ログ**です。リリース確定後は本書のエントリだけ更新し、`HANDOVER.md` は「現状」のみ保持してください。
詳細な背景・設計判断・修正コードは個別 `docs/2XX_RELEASE_STATE_*.md` を参照。

凡例:
- 🆕 = 機能追加
- 🔧 = 改善 / リファクタ
- 🐛 = バグ修正
- 🔒 = セキュリティ
- 📝 = ドキュメント / ツール
- 🎉 = マイルストーン

---

## v376.5 — 2026-05-26

| 種別 | 内容 |
|---|---|
| 🐛 | 変更申請の承認/却下後に「処理中…」ボタン文字列が滞留するバグ修正。`setBusy(null)` を `await load()` の前に移動 |
| 🐛 | 承認成功時に空オブジェクト `{}` が緑色のコードブロックで冗長表示されるバグ修正。`actionResult` state + JSON.stringify プリレンダー削除（既に alert で完了通知済） |
| 🔧 | 不要 API 往復洗い出し: 承認後の `await load()` は他 admin との並行整合性のため残置。`loading` / `actionError` / `expanded` state は必須機能のため残置。最終判断: メイン 2 点のみ修正 |

デプロイ: admin `@163`。影響範囲は `src/components/ChangeRequestConsole.tsx` のみ（バックエンド・データロジック影響ゼロ）。

---

## v376.4 — 2026-05-26

| 種別 | 内容 |
|---|---|
| 🧹 | テストデータ棚卸し・soft delete 機能を追加（`deleteTestDataPreview_LOG` / `deleteTestData_APPLY`）。条件: T_認証アカウント `demo-*` / T_会員 `DEMO-*` / 上記に紐づく職員 / T_外部申込者 氏名・フリガナに「テスト/ガイブ/セイゴウカクニン」を含む |
| 🎉 | 本番 DB のテストデータ削除実施 — T_外部申込者 3 件（`テスト タロウ` / `ガイブ テストイチロウ` / `セイゴウカクニン タロウ`）を soft delete。demo-* / DEMO-* は検出ゼロ（過去に cleanup 済 or 未投入）|

デプロイ: admin `@162`。

---

## v376.3 — 2026-05-26

| 種別 | 内容 |
|---|---|
| 🔧 | `inspectDryRunManifest_LOG` を追加（`previewDryRunApplicationCleanup` が return のみで Logger.log しない仕様への補助）。実行結果: manifest 未保存を確認（過去 dryRun テストデータの残骸ゼロ）|

デプロイ: admin `@161`。

---

## v376.2 — 2026-05-25

| 種別 | 内容 |
|---|---|
| 🎉 | **migration 本実行完了** — T_会員 180 rows / T_事業所職員 173 rows / T_外部申込者 3 rows、計 356 rows / 804 cells を全角カタカナへ変換。エラーゼロ。dryRun と件数完全一致 |
| 🔧 | `backfillKanaToFullwidth_APPLY()` ラッパー追加（editor ▶ ボタンが引数なしで実行する制約を回避し、1-click で本実行を可能化） |

デプロイ: admin `@160`。

---

## v376.1 — 2026-05-25

| 種別 | 内容 |
|---|---|
| 🐛 | `backfillKanaToFullwidth` が build pruner に削除され admin editor の関数選択に出ないバグを修正。`scripts/build-admin-gas.mjs` の keep-list に追加 |

デプロイ: admin `@159`。

---

## v376 — 2026-05-23

| 種別 | 内容 | 参照 |
|---|---|---|
| 🆕 | **フリガナ（セイ/メイ/フリガナ）の保存形式を全角カタカナに統一**。ひらがな・半角カナ・全角カタカナの混在入力を受け付け、保存時に NFKC + ひらがな→カタカナ + 全角スペース正規化を適用。中点 `・` と長音 `ー` のみ追加許容、それ以外（漢字・英数字）は throw | `src/utils/kanaNormalize.ts` |
| 🆕 | `normalizeKana()` / `normalizeAndValidateKana_()` を frontend (TS) + backend (GAS) 両方に実装（同一ロジック・冪等性確認済） | — |
| 🆕 | `backfillKanaToFullwidth({dryRun})` 移行関数を追加（T_会員 / T_事業所職員 / T_外部申込者 対象。dryRun=true で件数確認 → admin 承認後 dryRun=false で本実行） | — |
| 🔧 | 旧 `toHalfWidthKana` (frontend) を `normalizeKana` 呼び出しに置換 — MemberForm / MemberDetailAdmin / StaffDetailAdmin / MemberApplicationForm / MemberUpdateForm / TrainingRoster | — |
| 🔧 | バックエンド書込関数（saveMemberCore_ / overwritePublicApplicationMemberFields_ / overwritePublicApplicationStaffFields_ / submitPublicChangeRequest_ / normalizeStaffNameFields_）で正規化 + validation を信頼境界として強制 | — |
| 🔧 | 旧 `isHalfWidthKana` バリデーション（v131 系）を削除。ポリシー反転（半角強制 → 全角強制） | `validateMemberPayload_` |
| 📝 | 19 ケースの Vitest 単体テスト追加 (`scripts/test-kana-normalize.mts`)。`npm run prerelease` gate に組み込み | — |

実装方針: T_変更申請 pending レコードは migration 対象外（承認時 `approveAdminChangeRequest_` → 各 save 関数で正規化されるため）。

デプロイ予定: 3 split を build → push → redeploy → migration dryRun → 確認 → 本実行。

---

## v374.1 — 2026-05-21

| 種別 | 内容 | 参照 |
|---|---|---|
| 🆕 | **公式LINE投稿依頼コンソール**を管理者ポータルに新規追加。3 状態ライフサイクル（DRAFT → REQUESTED → POSTED）+ Drive 添付（画像/PDF・10MB）+ Polymorphic association（GENERAL / TRAINING、将来拡張可）+ LINE 風プレビュー | `docs/246_DESIGN_LINE_POST_REQUEST_2026-05-21.md` |
| 🆕 | T_LINE投稿依頼テーブル / 2 SystemSettings (`LINE_POST_ASSETS_FOLDER_ID` / `LINE_POST_NOTIFY_EMAIL`) / 6 admin API actions | `docs/03_DATA_MODEL.md` §4 |
| 🐛 | build pruner が関数内 `if (action === ...)` を dispatcher case と誤認する問題を回避するため、handler のパラメータ名を `action` → `transAction` に変更 | — |
| 🐛 | build parser が regex literal `/.../` を line comment と誤認する問題を回避するため、handler 内 regex を String 操作に置換 | — |

デプロイ: integrated/public `@346` x2 / member `@103` / admin `@155`

---

## v374 — 2026-05-21

| 種別 | 内容 | 参照 |
|---|---|---|
| 📝 | WCAG 2.2 AA 自動アクセシビリティテスト基盤導入（`@axe-core/playwright`、`scripts/test-a11y.mjs`、CI gate 対応） | `docs/244` |
| 📝 | 新 UI 追加時の必須回帰チェックリスト整備 | `docs/245` |
| 📝 | レスポンシブテストを `npm run test:responsive` / `:admin` / `:member` へ昇格 | — |
| 🐛 | 入会 hero badge `bg-emerald-600` (4.46:1, AA 未達) → `bg-emerald-700` (5.7:1, AA 準拠) | `src/public-portal/App.tsx` |
| 🐛 | `responsive-test.mjs` の sr-only skip link false-positive 解消 → 21/21 セル合格 | — |
| 🎉 | **WCAG 2.2 AA 自動検出範囲で違反ゼロ達成**（本番 a11y scan で critical/serious/moderate/minor=0 確認） | — |

デプロイ: integrated/public `@344→@345` x2 (legacy + 正式)、member `@102` 維持、admin `@153` 維持。

---

## v373.7 — 2026-05-20 🎉 Sprint S5 完了

| 種別 | 内容 |
|---|---|
| 🔧 | 名簿出力 Sprint S5 第 2 弾: GAS バックエンドの旧 RosterExport コードを完全削除（-1,599 行 + 自動 pruning で 315 関数削減） |
| 🔧 | ALLOWED_ACTIONS マップから 10 action 削除、dispatcher case 群削除 |
| 🔧 | `initializeSchema_` の旧キー seed 撤去、`SystemSettings.rosterTemplateSsId` pass-through 撤去 |
| 🔧 | `T_システム設定` の旧キー行は data 保全のため残置 |

詳細: `docs/243_RELEASE_STATE_v373.7_ROSTER_S5_GAS_CLEANUP_2026-05-20.md`
デプロイ: integrated/public `@344` x2 / member `@102` / admin `@153`

---

## v373.6 — 2026-05-20

| 種別 | 内容 |
|---|---|
| 🔧 | 名簿出力 Sprint S5 第 1 弾: 旧 RosterExport の front-end を完全削除（4 component / 137 行の UI / 10 ApiClient メソッド / 5 旧型定義、計 -2,447 行） |
| 🔧 | `T_システム設定` の旧キー行は data 保全のため残置 |

詳細: `docs/242_RELEASE_STATE_v373.6_ROSTER_S5_FRONTEND_CLEANUP_2026-05-20.md`

---

## v373.5 — 2026-05-20 🔒

| 種別 | 内容 |
|---|---|
| 🔒 | パスワード pepper を Google Cloud Secret Manager 連携化（CacheService → SM → Script Properties の 3 階層 fail-soft） |
| 🔒 | 3 split に `cloud-platform` OAuth scope 追加 |
| 🔒 | `healthCheckPasswordPepper` admin top-level 関数追加（fingerprint 比較で値の一致性検証） |
| 📝 | 次段階 Cloud Run Argon2id 外部 KDF の完全設計書 + 実装雛形（`cloud-run/password-hash-service/`） |

operator 対応: GCP 利用判断時に `docs/239` 30 分手順を実施。
詳細: `docs/241_RELEASE_STATE_v373.5_SECRET_MANAGER_2026-05-20.md` / `docs/240_DESIGN_CLOUD_RUN_ARGON2ID_2026-05-20.md`

---

## v373.4 — 2026-05-20

| 種別 | 内容 |
|---|---|
| 🔧 | 名簿出力 行フィルタ no-code UI 化（演算子記号 `=, >, <, ≥, ≤` を日本語ラベル化、enum/boolean 演算子廃止、年度フィールド除外、否定全廃） |

詳細: `docs/238_RELEASE_STATE_v373.4_ROSTER_ROW_FILTER_NOCODE_2026-05-20.md`

---

## v373.3 — 2026-05-20

| 種別 | 内容 |
|---|---|
| 🔧 | 条件付き書式 UX 微調整（year picker / equals 削除 / 否定削除 / filterYear 自動 prefill） |

詳細: `docs/237_RELEASE_STATE_v373.3_ROSTER_STYLE_RULE_SIMPLIFY_2026-05-20.md`

---

## v373.2 — 2026-05-20

| 種別 | 内容 |
|---|---|
| 🐛 | PDF 出力で全件が出ない問題を React Portal + `display: none` パターンで修正（`position: absolute` を撤去・MDN/react-to-print 既知問題対応） |
| 🔧 | 条件付き書式 UI を Airtable 風（フィールド + 演算子 + 値 + プリセット）に刷新、式入力を完全廃止 |
| 🔧 | 計算列を 8 プリセット選択化、textarea 廃止 |
| 🔧 | drag handle 改善（左端に全高 grip カラム、`cursor: grab/grabbing`） |

詳細: `docs/236_RELEASE_STATE_v373.2_ROSTER_UX_OVERHAUL_2026-05-20.md`

---

## v373.1 — 2026-05-20

| 種別 | 内容 |
|---|---|
| 🆕 | 名簿出力 PDF 出力（`window.print()` + 動的 `@page` CSS、用紙 A4/A3/B5・縦横・フォントサイズ） |
| 🐛 | v373.2 で PDF Portal 化に修正 |

詳細: `docs/235_RELEASE_STATE_v373.1_ROSTER_S4_2026-05-20.md`

---

## v373 — 2026-05-20

| 種別 | 内容 |
|---|---|
| 🆕 | 名簿出力 計算式 + 条件付き書式（jsep + 自前 AST walker、eval/Function/MemberExpression 全 reject、関数 allowlist 16 種、AST 深さ 32 上限、攻撃シナリオ含む 33 unit tests） |
| 🔒 | Web 検索 2026-05-20 ベースで `expr-eval`(RCE 2026) / `jse-eval`(no sandbox) を不採用、`jsep` のみ採用 |

詳細: `docs/234_RELEASE_STATE_v373_ROSTER_S3_2026-05-20.md`

---

## v372.9 — 2026-05-20

| 種別 | 内容 |
|---|---|
| 🆕 | 名簿出力 出力列を `@dnd-kit` で drag-drop 並び替え |

デプロイ: admin split `@145`。詳細: `docs/232_RELEASE_STATE_v372.9_ROSTER_S2_DRAG_DROP_2026-05-20.md`

---

## v372.8 — 2026-05-20

| 種別 | 内容 |
|---|---|
| 🆕 | 名簿出力 列幅 (60-320px) + 日付/数値書式設定 |

詳細: `docs/231_RELEASE_STATE_v372.8_ROSTER_S2_FORMAT_WIDTH_2026-05-20.md`

---

## v372.7 — 2026-05-20 🔒

| 種別 | 内容 |
|---|---|
| 🔒 | 第三者評価 2026-05-20 指摘 #1 対応: `getFileThumbnail_()` / `getFileBytes_()` の Drive fileId proxy を `T_研修.案内状URL` / `案内状サムネイルURL` 登録 fileId のみに制限（fail-closed） |

詳細: `docs/230_SECURITY_REMEDIATION_DRIVE_PROXY_ALLOWLIST_2026-05-20.md`

---

## v372 〜 v372.6.1 — 2026-05-19 〜 20

| 種別 | 内容 |
|---|---|
| 🆕 | 名簿出力 Visual Designer 骨組み（v372 S1）、フィールド辞書 36 件、テンプレ保存、CSV 出力、Tab UI、出力単位（会員/職員/混合）、列フィルタ |
| 🆕 | 公開ポータルに staffUpdate（既存職員情報変更）追加 |
| 🐛 | UTF-8 文字化けバグ修正 |
| 🔧 | CM 番号 admin 例外バリデーション緩和 |
| 🐛 | 公開ポータル変更申請 送信ボタン disable + ヒント表示 |

詳細: `docs/229_RELEASE_STATE_v372_to_v372.6.1_2026-05-20.md`

---

## v371 系 — 2026-05-18 〜 19（メール送信制御）

| 種別 | 内容 |
|---|---|
| 🔒 | メール送信 4 階層ガード導入（GLOBAL_ENABLED / MODE: LIVE/REDIRECT/SUPPRESS / ALLOWLIST / CATEGORY） |
| 🔒 | 初期値 `MAIL_GLOBAL_ENABLED=false`（safe-stop で着地） |

詳細: `docs/227_MAIL_KILL_SWITCH_2026-05-18.md`

---

## v360 〜 v370 — 2026-05-16 〜 17

研修名簿・出欠管理・一括メール明細・DB schema 変更・dryRun synthetic transaction フレームワーク・転籍時バグ修正。

詳細: `docs/225_RELEASE_STATE_v360_to_v370_2026-05-17.md`（統合 release state）/ `docs/223` / `docs/226`

---

## v320 〜 v358 — 2026-05-11 〜 16

- v320〜v332: モバイル viewport / レスポンシブ全面強化 / WCAG 2.2 AAA / Playwright 自動テスト 98/98 セル / パスワード規約
- v333: 役員向け請求を活動報告 + 経費請求 2 系統化
- v334: 役員管理の状態編集 + 読み込み高速化
- v335: 入会申込キュー化 + 同一人物移行
- v336-v338: 検索改善
- v340-v345: 様々な修正（会員ステータスメモ、年会費管理遷移、schema-shift 構造的防止 等）
- v347-v358: PDF サムネイル + lightbox 反復改善

詳細: 個別 `docs/186-222_*.md` 参照（または `docs/archive/release_history/`）

---

## v260 〜 v319 — 2026-04-24 〜 05-09

セキュリティ是正（第三者評価 docs/109 対応）、認証認可、ポータル分離、パスワードハッシュ PBKDF2 移行、OAuth スコープ最小化、CI セキュリティゲート、admin/member ポータル split 化等。

詳細: 個別 `docs/139-196_*.md` 参照（または `docs/archive/release_history/`）

---

> **過去のリリース** (v200 以下) は `docs/archive/release_history/` に保管しています。
