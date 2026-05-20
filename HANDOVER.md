# 開発引継ぎ

更新日: 2026-05-20（v373.4 まで本番反映済み・行フィルタ no-code UI 化）
現行本番: **`v373.4`** / integrated-public GAS version `341` / member split GAS version `99` / admin split GAS version `150`
fixed deployment: integrated/public `@341` x2 / member split `@99` / admin split `@150`

> **🆕 次担当者向け再開ガイド（必読）**
>
> ### 1. まず読む順
> 1. `AGENTS.md` §0 — シークレット絶対ルール
> 2. 本 `HANDOVER.md` ヘッダー〜「v372 系包括サマリー」
> 3. `docs/238_RELEASE_STATE_v373.4_ROSTER_ROW_FILTER_NOCODE_2026-05-20.md` — **v373.4 行フィルタの no-code UI 化（演算子記号→日本語、enum/boolean 演算子廃止、年度除外、否定全廃）（本番反映済み・最新）**
> 4. `docs/237_RELEASE_STATE_v373.3_ROSTER_STYLE_RULE_SIMPLIFY_2026-05-20.md` — v373.3 条件付き書式 UX 微調整
> 4. `docs/236_RELEASE_STATE_v373.2_ROSTER_UX_OVERHAUL_2026-05-20.md` — v373.2 名簿出力 UX 全面是正（PDF修正/プリセット化/drag handle）
> 4. `docs/235_RELEASE_STATE_v373.1_ROSTER_S4_2026-05-20.md` — v373.1 S4 PDF 初版（v373.2 で修正済み）
> 5. `docs/234_RELEASE_STATE_v373_ROSTER_S3_2026-05-20.md` — v373 S3 計算式+条件付き書式 初版（v373.2 で UI 刷新）
> 6. `docs/232_RELEASE_STATE_v372.9_ROSTER_S2_DRAG_DROP_2026-05-20.md` — v372.9 S2 drag-drop（本番反映済み）
> 4. `docs/233_HANDOVER_v372.9_NEXT_TASKS_2026-05-20.md` — v372.9 後の残タスク整理・次担当者引継ぎ
> 5. `docs/231_RELEASE_STATE_v372.8_ROSTER_S2_FORMAT_WIDTH_2026-05-20.md` — v372.8 名簿出力 S2 列幅・書式（本番反映済み）
> 6. `docs/230_SECURITY_REMEDIATION_DRIVE_PROXY_ALLOWLIST_2026-05-20.md` — v372.7 Drive proxy allowlist 是正（本番反映済み）
> 7. `docs/229_RELEASE_STATE_v372_to_v372.6.1_2026-05-20.md` — v372〜v372.6.1 の設計・実装・運用詳細
> 8. `docs/03_DATA_MODEL.md` — 最新スキーマ（ER 図 + バリデーション規約 + バージョン履歴）
> 9. `docs/12_ENGINEERING_RULEBOOK.md` / `docs/09_DEPLOYMENT_POLICY.md` — 開発・デプロイ標準
>
> ### 2. 現行本番デプロイ
> - **統合 public legacy** `AKfycbywpWoYxij6A-ZunIeBjG1Q8qX78PMMTsT3frx1cM5PJ2nAuZpz81KruXb5LIvWgbQx` @341
> - **統合 public 正式**   `AKfycbxyuUXgK1oHUDMahQjluiL-gcrMK0qV0FWLFYaYBqGxlRSg9NhvmbyQRyf0dvaqg7Zp` @341
> - **member split**     `AKfycbxd_6HlH5aWLhxYOtLUHehI3ODiHg4fpc5SCzNdEBIDbDpaBuU3KTuqDRbeBmhWZxSQ_g` @99
> - **admin split**      `AKfycbwSCTTyvWY_cFG764XawdbqA8r0qxYbav4aDZ-BK9rRmvXHoUXrKQnQ9egRGqWcx4Os` @150
>
> ### 3. 🔴 操作者の即時対応タスク（未完了・優先度高）
> | # | タスク | 詳細 |
> |---|---|---|
> | 1 | `runRebuildSchemaForV360` Run | admin Apps Script editor で 1 回。v360 schema migration（未実行だと一括メール明細が動作不可） |
> | 2 | `setupPendingThumbnailsTrigger` Run | admin Apps Script editor で 1 回。PDF サムネイル後追い再生成 10 分 trigger 登録 |
> | 3 | `cleanupCorruptChangeRequestsV372` Run | admin Apps Script editor で 1 回。文字化け申請レコード soft-delete |
> | 4 | メール送信制御の確認 | admin → システム設定 → メール通知 → 「メール送信制御」セクションで `MAIL_GLOBAL_ENABLED=false`（safe-stop）状態を確認 |
> | 5 | v360-v372 実ブラウザ動作確認 | 名簿出力 Visual Designer / 公開ポータル staffUpdate / CM 番号緩和 等 |
>
> ### 4. 直近の重要変更（v373 系 / v372 系）
> v373.2 は **`docs/236_RELEASE_STATE_v373.2_ROSTER_UX_OVERHAUL_2026-05-20.md`**（名簿出力 UX 全面是正：PDF Portal 化 / 条件付き書式構造化 / 計算列プリセット化 / drag handle 改善）、v373.1 は **`docs/235_RELEASE_STATE_v373.1_ROSTER_S4_2026-05-20.md`**（S4 PDF 初版、v373.2 で修正）、v373 は **`docs/234_RELEASE_STATE_v373_ROSTER_S3_2026-05-20.md`**（S3 計算式+条件付き書式 初版、v373.2 で UI 刷新）、v372.9 は **`docs/232_RELEASE_STATE_v372.9_ROSTER_S2_DRAG_DROP_2026-05-20.md`**、残タスク整理は **`docs/233_HANDOVER_v372.9_NEXT_TASKS_2026-05-20.md`**、v372.8 は **`docs/231_RELEASE_STATE_v372.8_ROSTER_S2_FORMAT_WIDTH_2026-05-20.md`**、v372.7 は **`docs/230_SECURITY_REMEDIATION_DRIVE_PROXY_ALLOWLIST_2026-05-20.md`**、v372〜v372.6.1 の包括変更は **`docs/229_RELEASE_STATE_v372_to_v372.6.1_2026-05-20.md`** に集約。
>
> **v373.2 ハイライト（最重要）**:
> - **PDF 修正**: `position:absolute` を撤去し React `createPortal` で `<body>` 直下にマウント → `body > *:not(.roster-print-portal) { display: none }` で兄弟を消去。通常フロー配置で自動ページ分割が機能。MDN/react-to-print issue #2 既知問題の標準解決パターン
> - **条件付き書式 UI 刷新**: Airtable「Color by Conditions」型へ。式入力 UI を完全廃止し、フィールド `<select>`（optgroup）+ 演算子 + 値 + スタイルプリセット 5 種 の構造化編集
> - **計算列プリセット化**: textarea 廃止、8 プリセット（年会費○×/未納警告/フリガナ/住所フル/電話優先/事業所+役職/CM+事業所/空欄）から選択。既存式は `findPresetByFormula` で照合、不一致は legacy として読取専用保持
> - **Drag handle 改善**: 左端に全高 grip カラム（w-8 + `⋮⋮` + 番号バッジ）、`cursor: grab/grabbing`。Airtable/Notion/Linear パターン
> - 後方互換: legacy `when:` rules / freeform formulas は引き続き評価される（UI は読取専用 + 「新形式に置換」ボタン）
>
> **v373 ハイライト**: jsep + 自前 AST walker による safe formula engine（eval/Function/member access 全 reject、関数 allowlist 16 種、AST 深さ 32 上限）。`scripts/test-formula-eval.mts` で攻撃シナリオ 9 件含む 33 テスト pass。Web 検索 2026-05-20 ベースで `expr-eval`(2026 RCE) / `jse-eval`(no sandbox) を不採用、`jsep` のみ採用根拠は `docs/234` §3 参照。v373.2 で UI は廃止されたがエンジン（評価器）は formula 列 + legacy 条件式の両方で引き続き稼働。
>
> ### 5. 既知の制約・要注意事項
> - **v372.7 security remediation 反映済み**: 2026-05-20 第三者評価 #1 対応として、Drive bytes / thumbnail proxy を `T_研修.案内状URL` / `案内状サムネイルURL` 登録 fileId のみに制限。integrated/public `@341` x2 / member `@99` / admin `@143`。詳細: `docs/230_SECURITY_REMEDIATION_DRIVE_PROXY_ALLOWLIST_2026-05-20.md`。
> - **メール送信は safe-stop**: `MAIL_GLOBAL_ENABLED=false` で起動。テスト目的なら REDIRECT モードに切替（system 設定 UI）
> - **PDF サムネイル**: Drive 側の thumbnail 生成タイミングで `案内状サムネイルURL` が空着地する場合あり。`processPendingThumbnails` trigger で自動修復（trigger 未登録だと永続）
> - **介護支援専門員番号**: 公開ポータルは厳格 8 桁数字。admin（MASTER/ADMIN）画面でのみ 1-10 桁英数字を許容（HN/HS プレフィックス対応）。詳細 docs/03_DATA_MODEL.md §4.1
> - **名簿出力 旧 RosterExport.tsx**: legacy として残存。Sprint S5 で完全削除予定（PDF レンダリング刷新が完成後）
> - **公開ポータル変更申請**: v372.5 で staffUpdate（既存職員情報変更）を追加。v372.6 で UTF-8 文字化けバグ修正

> **🆕 2026-05-20 v372.9 本番反映済み（名簿出力 S2 drag-drop）**
>
> **対応**: 名簿出力 Visual Designer の出力列を `@dnd-kit` で drag-drop 並び替え可能にした。既存の ↑/↓ ボタンは残置。PointerSensor は 6px 移動後に開始し、KeyboardSensor も有効化。
>
> **デプロイ**: admin split `@145` のみ更新。integrated/public `@341` x2、member split `@99` は変更なし。詳細: `docs/232_RELEASE_STATE_v372.9_ROSTER_S2_DRAG_DROP_2026-05-20.md`

> **🆕 2026-05-20 v372.8 本番反映済み（名簿出力 S2 部分対応: 列幅・書式）**
>
> **対応**: 名簿出力 Visual Designer の列ごとに列幅（60〜320px）と日付/数値書式を設定できるようにし、プレビューと CSV 出力へ反映。既存 `RosterColumnDef.width` / `align` / `format` を使用するため DB スキーマ変更なし。
>
> **デプロイ**: admin split `@144` のみ更新。integrated/public `@341` x2、member split `@99` は変更なし。詳細: `docs/231_RELEASE_STATE_v372.8_ROSTER_S2_FORMAT_WIDTH_2026-05-20.md`

> **🆕 2026-05-20 v372.7 本番反映済み（第三者評価 #1 Drive proxy allowlist）**
>
> **対応**: `getFileThumbnail_()` / `getFileBytes_()` の Drive fileId proxy を `T_研修.案内状URL` / `案内状サムネイルURL` に登録済みの fileId へ限定。public 境界では申込受付中研修のみ許可し、未許可 fileId は fail-closed（thumbnail は placeholder、bytes は `access_denied`）。
>
> **デプロイ**: integrated/public `@341` x2 / member split `@99` / admin split `@143`。詳細: `docs/230_SECURITY_REMEDIATION_DRIVE_PROXY_ALLOWLIST_2026-05-20.md`

> **🆕 2026-05-19 v372 S1 本番反映済み（名簿出力 Visual Designer 第1段階）**
>
> **背景**: 旧 RosterExport（外部 Google Sheets テンプレ依存）は柔軟性・カスタマイズ性・項目固定が問題で「ほぼ使えない」状態。設計書 `docs/228_ROSTER_REDESIGN_2026-05-19.md` に基づき全面刷新。Sprint 5 段階で進める。
>
> **S1 完了範囲**:
> - `getRosterFieldDictionary_()` で 36 フィールド宣言（member/office/fee/computed）
> - `getRosterDesignerData_()` で生データを Record 形式で返却
> - `loadRosterTemplatesV2_` / `saveRosterTemplateV2_` / `deleteRosterTemplateV2_` / `duplicateRosterTemplateV2_` の admin callable
> - 保存先: `T_システム設定.ROSTER_TEMPLATE_LIBRARY_V2`（JSON）
> - 新 `RosterDesigner.tsx`: チェックボックス選択 + 列並び替え（↑↓）+ 列名編集 + 配置選択 + 件数表示設定 + CSV 出力 + プレビュー
> - 旧 `RosterExport.tsx` は `roster-export-legacy` ビューとして残置（Sidebar 非表示・S5 で完全削除）
>
> **S3-S5 残作業**:
> - **S2**: v372.8〜v372.9 で完了（列幅・配置・日付/数値書式・テンプレ複製・@dnd-kit drag-drop）。本番ブラウザで drag-drop / キーボード並び替え確認のみ残。
> - **S3**: 計算式（内製簡易式）・条件付き書式
> - **S4**: PDF 出力（window.print + @page CSS）+ レイアウト（A4/A3/縦横/フォントサイズ）
> - **S5**: Excel 出力（xlsx 再評価）+ 旧 RosterExport / TemplateValidationPanel / TemplateHelpPage / RosterTemplateHelpDialog / 旧 GAS 関数群を完全削除
>
> **コミット**: `3dbccc4 feat: v372 S1 名簿出力 Visual Designer 骨組み`

> **🆕 2026-05-19 v371.1 本番反映済み（メール送信制御の 4 階層ガード導入）**
>
> **背景**: テスト環境として本番 DB を使う運用中に「メールが実際の宛先へ飛んでしまう」課題がありユーザーから即時停止と細粒度制御の要望。Web 検索（2026-05-18 取得）に基づくベストプラクティス採用。
>
> **設計**:
> 1. `MAIL_GLOBAL_ENABLED` — 全停止スイッチ（初期値 `false`、safe-stop で着地）
> 2. `MAIL_DELIVERY_MODE` — `LIVE` / `REDIRECT` / `SUPPRESS`
> 3. `MAIL_REDIRECT_ALLOWLIST` — REDIRECT モード時の宛先（カンマ区切り・複数可）
> 4. 補完 6 カテゴリの `*_ENABLED` フラグ（既存 9 カテゴリと並列）
>    - `TRAINING_APPLY_RECEIPT_ENABLED` / `TRAINING_REMINDER_ENABLED` / `BULK_MAIL_ENABLED` / `AUTH_OTP_ENABLED` / `MEMBER_UPDATE_CONFIRM_ENABLED` / `WITHDRAWAL_CONFIRM_ENABLED`
>
> **実装**:
> - `gas-src/Code.full.gs` に `mailDispatchPolicy_()` + `deliverMail_(category, to, subject, body, options)` ヘルパー追加
> - 既存 10 箇所の直接 `MailApp.sendEmail` / `GmailApp.sendEmail` 呼出しを `deliverMail_` 経由に置換
> - 中央 `sendEmailWithValidatedFrom_` は最終送信ポイント（gate は deliverMail_ 側に集約、二重判定なし）
> - REDIRECT 時は件名に `[REDIRECT from <origTo>]`、本文先頭に `--- ORIGINAL TO: <origTo> --- --- CATEGORY: <cat> ---` を付与
> - `getSystemSettings_` / `updateSystemSettings_` に新 9 フィールド読み書き対応
> - React 側 `src/types.ts` `SystemSettings` + `src/App.tsx` システム設定 UI に「メール送信制御」セクション追加
> - DB_SCHEMA_VERSION を `2026-05-19-mail-kill-switch-v371` に bump し、`initializeSchema_` 内 mailGuardDefaults でキー自動投入（既存値は上書きしない idempotent ガード）
>
> **デプロイ**: 統合 public `@331` x2 / member `@89` / admin `@132`
>
> **テスト復帰手順**: システム設定 → メール通知タブ → 「メール送信制御」セクションで
> 1. `MAIL_GLOBAL_ENABLED=true`
> 2. `MAIL_DELIVERY_MODE=REDIRECT`
> 3. `MAIL_REDIRECT_ALLOWLIST=kenta-noguchi@tadakayo.jp`
> 4. 「設定を保存」
> → 全メールが野口さん宛のみに集約。ドライランテスト可能。
>
> **本番運用復帰手順**:
> 1. `MAIL_GLOBAL_ENABLED=true`
> 2. `MAIL_DELIVERY_MODE=LIVE`
> 3. 必要に応じてカテゴリ別 ENABLED を調整
> → カテゴリ別フラグに従って通常送信。
>
> **詳細**: `docs/227_MAIL_KILL_SWITCH_2026-05-18.md`（本セッション草案）。Web 検索ソース: Mailtrap / Postmark / Moosend / Drupal Mail Redirect / Laravel always-to パターン。

> **🆕 2026-05-18 次担当者向け再開状態（必読）**
>
> - **現在の入口は本 `HANDOVER.md` と `docs/225_RELEASE_STATE_v360_to_v370_2026-05-17.md`。** `docs/224_RESUME_v360_2026-05-16.md` は v361 時点の履歴資料であり、現行状態の入口にはしない。
> - 現行本番は v370 / integrated-public `@329` x2 / member `@87` / admin `@129`。`docs/09_DEPLOYMENT_POLICY.md` と `docs/00_DOC_INDEX.md` も同値へ更新済み。
> - AGENTS.md §0 に合わせ、`gas/admin/.clasp.json` / `gas/member/.clasp.json` を Git 追跡対象から除外し、`.gitignore` の `!gas/**/.clasp.json` 例外を削除。ローカルファイルは削除せず保持。新規環境では各自ローカルで `.clasp.json` を作成する。
> - admin callable から dryRun 物理削除関数（`previewPhysicalDeleteDryRunData` / `executePhysicalDeleteDryRunData`）を削除。soft delete cleanup (`executeDryRunApplicationCleanup`) は維持。
> - 研修名簿 UI は CSV 出力のみに統一。`CopyButton` のタップターゲットは 44px に修正。
>
> **次に読むべき順:** `AGENTS.md` §0 → 本 `HANDOVER.md` → `docs/225_RELEASE_STATE_v360_to_v370_2026-05-17.md` → `docs/226_HANDOVER_DRYRUN_2026-05-17.md` → `docs/09_DEPLOYMENT_POLICY.md`。

> **🆕 2026-05-17 引継ぎ時のセッション要点（必読）**: 詳細 `docs/226_HANDOVER_DRYRUN_2026-05-17.md`
>
> **本セッションでの成果:**
> - dryRun synthetic transaction フレームワーク を実装・本番 DB で 6/7 シナリオ PASS を確認・cleanup 完了 → **コミット済み (`d110b48`)**
> - 検証対象: 新規申込（個人/賛助/事業所）+ 3 種の転籍（個人↔事業所職員・事業所 A→B 職員）
> - 追加されたツール: `node scripts/dryrun-applications.mjs run|preview|cleanup --yes` + 3 GAS 関数 (`dryRunApplicationScenarios` / `previewDryRunApplicationCleanup` / `executeDryRunApplicationCleanup`)
>
> **🔴 操作者による即時対応が必要なタスク（残作業）:**
> 1. **`runRebuildSchemaForV360` を admin Apps Script editor で 1 回 Run** — ✅ 完了済み（2026-05-18, xorViolations: 0, T_メール送信明細 作成 OK, ログSS の研修ID列追加だけ別件で失敗）
> 2. **`runCleanupPartialBusinessV370_53779700` を admin Apps Script editor で 1 回 Run + 変更申請再承認** — ✅ 完了済み（2026-05-18, 申請 CR1778920612878_22c197b0 承認済み）
> 3. **v360〜v371.2 の実ブラウザ動作確認** — 残作業。確認観点は `docs/225_RELEASE_STATE_v360_to_v370_2026-05-17.md` §3 と `docs/223_RELEASE_STATE_v360_2026-05-16.md` §5 + メール送信制御セクション動作確認
> 4. **テスト環境メール制御**: システム設定 → メール通知タブ → 「メール送信制御」セクションで `MAIL_GLOBAL_ENABLED=true` + `MAIL_DELIVERY_MODE=REDIRECT` + allowlist に自分のメール を設定すれば dryRun テスト可
>
> **✅ コミット済み**: `605f69f feat: ship v360-v371.2 (training roster, mail templates, transfer hotfixes, mail kill switch)` で v360〜v371.2 + 2026-05-18 cleanup + メール送信 4 階層ガードを 1 コミットにまとめ済み。
>
> **✅ devMode 状態**: 全 4 deployment が v371.2 (@332/@90/@133) に着地済み。devMode と fixed は同一バージョン。
>
> **旧注記:** `docs/224_RESUME_v360_2026-05-16.md` は v361 時点の一時再開ガイド。古い deployment 値を含むため、現行判断には使わない。

> 直近の包括変更履歴: `docs/225_RELEASE_STATE_v360_to_v370_2026-05-17.md`。データモデル設計: `docs/03_DATA_MODEL.md`（最新）+ `docs/learning/16_system_overview_v370_2026-05-17.html`（HTML 概要）。
>
> **🚨 直前の重大事象（v370 緊急 bug fix・反映済み）**: v368 で導入した転籍時 Logger.log で undefined 変数 `srcMemberId` を参照していたため、事業所会員入会申込承認時に既存個人会員と CM 番号一致した職員が含まれていると `convertIndividualToStaff_` が ReferenceError でクラッシュ。結果、事業所会員 + 代表者 1 名のみ登録され残職員は未作成 + 申請 PENDING のまま。変数名を正しい `sourceMemberId` に修正済み（v370）。さらに v370.1 で診断/cleanup 関数を admin split に追加（`diagnoseAllStaleApplicationsForV370` / `cleanupStaleBusinessApplicationForV370`）。
>
> **⚠️ partial データの後始末（operator 対応中）**: 申請 `CR1778920612878_22c197b0`（枚方市包括支援センターはなまる）で会員ID `53779700` が partial 登録されている。Apps Script editor から **`runCleanupPartialBusinessV370_53779700`** を 1 回実行 → cleanup 完了確認後、変更申請管理コンソールから再承認すれば 3 名全員が正常作成される。

> **🆕 2026-05-17 v369 本番反映済み**: v368 で追加した 9 システム設定キー（APPLICATION_RECEIPT_*, APPROVAL_NOTIFICATION_*, REJECTION_NOTIFICATION_*）をシステム設定 UI から編集可能に。`src/types.ts` `SystemSettings` に 9 フィールド追加、`getSystemSettings_` / `updateSystemSettings_` に読み書き対応、システム設定の「入会・登録メール設定」サブビュー末尾に「▍変更申請ワークフロー（受付・承認・却下）のメール」セクション追加（受付確認/承認通知/却下通知 各 EmailCard + 差込変数ガイド）。スプレッドシート直編集不要。integrated/public `@328` x2 / member `@86` / admin `@128`。

> **🆕 2026-05-17 v368 本番反映済み**: 2 件の改修。
> **(1) 個人/賛助→事業所職員転籍時の代表メアド必須を緩和**: CM番号で紐づけているため、転籍元会員のメアドが空でも転籍を通すように。空のときは credential メール送信は skip し、職員レコードのみ作成。Logger に警告ログ。
> **(2) 申込/承認/却下メールをテンプレ化**: ハードコード文言を 9 件の新規システム設定キー (APPLICATION_RECEIPT_*, APPROVAL_NOTIFICATION_*, REJECTION_NOTIFICATION_* 各 ENABLED/SUBJECT/BODY) に切替。差込変数 `{{氏名}} {{会員種別ラベル}} {{申請種別}} {{申請ID}} {{受付日時}} {{処理日時}} {{処理者名}} {{変更内容サマリー}} {{処理備考}}` をサポート。`buildChangeSummaryText_` ヘルパーで変更内容を人間可読サマリーに変換。`sendApplicationReceiptMail_` / `sendApprovalNotificationMail_` / `sendRejectionNotificationMail_` 3 ヘルパー新設。**システム設定 UI への新規キーの編集フォーム追加は未実装** — DB シート `T_システム設定` に新キーは初期化されるが、画面から編集するには次リリースで UI 追加が必要（現状はスプレッドシート直編集で運用可能）。integrated/public `@327` x2 / member `@85` / admin `@127`。

> **🚨 2026-05-17 v367 本番反映済み（緊急バグ修正）**: **変更申請の承認/却下が常に `unauthorized` で失敗していた**（公開ポータルからの入会申込・変更申請・退会申請がすべて DB 反映不可だった重大不具合）。原因は 3 層:
> 1. `approveAdminChangeRequest_` / `rejectAdminChangeRequest_` で `adminSession.email` を参照していたが、`checkAdminBySession_()` の戻り値には `email` キーが存在せず `loginId` キーのみ（4 箇所修正）
> 2. dispatcher が inner の `{success:false}` を outer `{success:true, data:{...}}` で包み client に成功扱いで返していた → approve/reject の dispatcher 分岐で inner.success を検知し outer へ伝播
> 3. `ChangeRequestConsole.tsx` が inner.success を確認せず常に「承認処理が完了しました」alert を表示していた → inner.success===false なら actionError として表示
> integrated/public `@326` x2 / member `@84` / admin `@126`。

> **🆕 2026-05-17 v366 本番反映済み**: 年会費管理コンソールの SharedMemoPanel を画面上部に sticky 化（sm+ のみ・モバイルは通常スクロール、Nielsen 推奨「モバイル sticky は 15% 超過 NG」回避）。`SharedMemoPanel` に `sticky?: boolean` prop 追加 → `position: sticky; top: 0; z-index: 30`。IntersectionObserver で sentinel が viewport 上方へ消えたタイミング（stuck）を検知し自動 collapsed 化（peek mode へ移行）、shadow も付与してスクロールコンテンツとの境界を明示。展開状態のままユーザーが手動 collapse 済みなら干渉しない。integrated/public `@325` x2 / member `@83` / admin `@125`。

> **🆕 2026-05-17 v365 本番反映済み**: 年会費一覧の会員名横に **コピーボタン**を追加。新規 `src/components/CopyButton.tsx`（再利用可能）— `navigator.clipboard.writeText` 優先 + `document.execCommand('copy')` fallback（非 HTTPS 環境対応）、クリック後 1.5 秒でアイコン切替（clipboard → check）、aria-live="polite" で SR 通知、`stopPropagation` で行クリック非干渉、タップターゲットは 2026-05-18 cleanup で 44px に修正済み。会員名のみコピー（"ケアプランセンターうぐいすの里" 等）。失敗時は ✕ アイコン + 赤バッジに切替。integrated/public `@324` x2 / member `@82` / admin `@124`。

> **🆕 2026-05-17 v364 本番反映済み**: 年会費管理コンソールの年会費一覧で、**前年度（selectedYear − 1）に有効会員だったのに前年度年会費が UNPAID または未記録の行**を red-50 背景 + 左ボーダー(border-l-4 border-red-400) + ⚠ アイコン + 「{年}年度未納」テキスト で常時ハイライト。WCAG 2.2 推奨「色だけに頼らない」に準拠。上部サマリに「前年度({year-1}年度)未納 X 件」カードを追加。バックエンド: `AnnualFeeAdminRecord` に `previousYear` / `previousYearEligible` / `previousYearStatus` を追加、`isAnnualFeeEligibleMemberForYear_(member, prevYear)` で前年度在籍判定。キャッシュキー `v364-prev:{year}` で旧キャッシュ無効化。integrated/public `@323` x2 / member `@81` / admin `@123`。

> **🆕 2026-05-16 v363.2 本番反映済み**: 会員詳細をモーダルダイアログ表示に変更。v363 の新タブ方式は GAS DOMAIN 認証で毎回ログイン画面に戻る問題のため廃止。`openMemberDetail` を `memberDetailModalOpen` state ベースの overlay 表示に変更し、`currentView` は元のまま維持（背景に元コンソールが見える）。閉じ方: ✕ ボタン / ESC キー / backdrop クリック の 3 方法。role="dialog" + aria-modal + aria-label で a11y 対応。職員詳細遷移は従来通り currentView を切替。`src/utils/deepLink.ts` は今回未使用だが、APP_URL 注入は doGet に残置（将来の deep link 用）。integrated/public `@322` x2 / member `@80` / admin `@122`。

> **🆕 2026-05-16 v362 本番反映済み**: 管理コンソール全検索の正規化を強化。`src/utils/search.ts` の `matchesSearchQuery` に **ひらがな → カタカナ統一** + NFC を追加し、`半角カナ / 全角カナ / 全角ひらがな` のいずれの入力でもフリガナ検索がヒットするように。`AdminDashboardMemberRow` / `AnnualFeeAdminRecord` / `BulkMailRecipient` / `MailingListTarget` に `kana` 列追加し、検索値配列とプレースホルダーも更新。`getAnnualFeeAdminCacheKey_` / `getAdminDashboardCacheKey_` を `v362-kana` で bump し旧キャッシュ無効化。`scripts/test-search.mts` で 16 ケース単体テスト追加（`npm run test:search`）。
>
> **⚠️ 教訓**: `npm run build:gas` は `gas/admin/Code.gs` / `gas/member/Code.gs` を再生成しない（backend と HTML のみ）。admin/member への変更は **必ず `npm run build:gas:admin` / `build:gas:member` を個別実行**してから clasp push する。v362 deploy 直後の hotfix（@118/@77 → @120/@78）の原因。

> **⏸ 2026-05-16 v361 時点の一時中断メモ（履歴）**: `docs/224_RESUME_v360_2026-05-16.md` は v361 時点の履歴資料。現行の再開入口は本 HANDOVER と `docs/225_RELEASE_STATE_v360_to_v370_2026-05-17.md`。残作業は引き続き admin split で `runRebuildSchemaForV360` を 1 回 Run（schema データ migration・未実行だと一括メール送信のみ動作不可）+ v360〜v370 実ブラウザ確認。
>
> **🆕 2026-05-16 v361 本番反映済み（v360 hotfix）**: v360 で導入した SheetJS xlsx の dynamic import が `import.meta.url` を bundle に漏らし、`compress-html.mjs` の `new Function()` ラッパーと非互換で **会員マイページ・管理コンソールがクラッシュ**した。v351 と同類のトラップ。**xlsx を完全除去し CSV (UTF-8 BOM 付き) のみ提供** に変更。`scripts/compress-html.mjs` に **build 時 import.meta 残存検知 gate** を追加し再発防止。全 4 deployments を v361 へ redeploy（integrated `@319` x2 / member `@76` / admin `@117`）。
>
> **v360 機能は引き続き有効**: 研修名簿・出欠管理・一括メール明細・M_出欠状態・T_研修申込 5 列追加・T_メール送信明細・2-FK 化。Excel 出力は `.csv` (BOM) で代替（Excel で直接開ける）。
>
> **⚠️ 残作業（operator・優先度高）**: (1) admin split で `runRebuildSchemaForV360` を Apps Script editor から 1 回 Run（T_メール送信明細 ログ SS 作成 + 2-FK migration + 出欠 backfill + テンプレ category 追加）。 (2) admin shell をブラウザで開いて起動確認（v361 で復旧済みのはず）。 (3) 研修名簿タブの動作確認。手順: `docs/223_RELEASE_STATE_v360_2026-05-16.md` §5。
>
> **コミット状態**: working tree 未コミット。次担当者は `git status --short` と `git diff` で、v360-v370 本体・2026-05-18 cleanup・`.clasp.json` 追跡解除が混在していることを確認してから commit 範囲を決める。

> **2026-05-16 v359 反映済み**: 会員ログイン UX / パスワード再設定を改修。会員ログインは `memberLoginWithData` ではなく `memberLogin` で認証を先に完了し、会員ポータルデータは既存の遅延ロードに切替。ログイン画面にログインID保存、パスワード表示/非表示、`ログインID + 登録メールアドレス` によるパスワード再設定メール送信を追加。事業所職員アカウントの登録メール正本は `T_事業所職員.メールアドレス`。再設定メールは `CREDENTIAL_EMAIL_FROM` を使用し、確認コードは短期キャッシュでハッシュ保存、成功時に失敗回数とロック状態をリセットする。integrated/public `@317` x2 / member `@74` / admin `@115`。詳細: `docs/222_RELEASE_STATE_v359_2026-05-16.md`

> **2026-05-16 v358 反映済み**: 案内 PDF lightbox プレビューを w2000 高解像度 PNG `<img>` モーダルへ着地。v355 (Drive `/preview` iframe = CSP frame-ancestors) / v357 (blob URL iframe = Chrome cross-origin block) が構造的に動かない理由が判明したため、Drive thumbnailLink から取った高解像度 PNG を 1 ページ目だけ表示し、全ページは「別タブで開く」で Drive viewer に飛ばす設計に統一。`extractDriveFileId_` 共通ヘルパー導入で `/d/`, `?id=`, URL encode 形式の `unparseable_url` も解消。`getFileThumbnail_` に `size` 引数追加 (`api.getFileThumbnail(url, 2000)`)。v354〜v358 の経緯詳細: `docs/221_RELEASE_STATE_v354_to_v358_2026-05-16.md`

> **2026-05-15 v353 反映済み (上書きずみ、参考)**: v352 で公開ポータル `PublicTrainingList.tsx` を A4 サムネイル化したが、ユーザー実機画面は会員マイページの **`src/components/TrainingApply.tsx`** の「受付中の研修」だったため認識違いを修正。同一仕様（A4 縦サムネイル / クリック PDF / 開催日時・会場・主催・講師・定員・会員研修費の `<dl>` 表示 / `min-h-[44px]` / `<article>` semantic）を会員側にも適用。member split のみ更新、public/admin は変更なし。詳細: `docs/220_RELEASE_STATE_v353_2026-05-15.md`

> **2026-05-14 v352 反映済み**: 公開ポータル「現在受付中の研修」一覧 (`src/public-portal/components/PublicTrainingList.tsx`) を A4 縦サムネイル + 詳細情報の 2 カラムカードへ再設計。`PdfThumbnail` に `aspectRatio` prop を追加 (`'210 / 297'` = A4 縦)。WCAG 2.5.5 タップターゲット 44px / semantic HTML / aria-label を採用。public のみ deploy、member/admin は v350 のまま。詳細: `docs/219_RELEASE_STATE_v352_2026-05-14.md`

> **2026-05-14 v351 ロールバック完了**: v351 で導入した `pdfjs-dist` の dynamic import が、`vite-plugin-singlefile` のデフォルト挙動（bundle を plain `<script>` 化）と組み合わさり、`pdfjs-dist/build/pdf.mjs:9421` の `import.meta.url`（Node 専用 dead code）が parse 時に `Uncaught SyntaxError: Cannot use 'import.meta' outside a module` を投げ、admin shell 全体がクラッシュ。4 fixed deployment を全て v350 (`@309 x2 / @66 / @108`) へ即時 redeploy 戻しした。GAS Apps Script コードと build artifact は v351 commit 群（`606c520 / f1ed4be / 37d92c5`）として git に残るが、本番には未反映。再挑戦時は `@rollup/plugin-replace` で pdfjs-dist 内の `import.meta.url` をリテラル置換するなど、Vite bundle 構成側の対策が必要。罠詳細: `memory/feedback_pdfjs_dist_vite_singlefile_trap.md`

> **2026-05-14 v350 反映済み (参考)**: 案内 PDF サムネイルの生成時間を **20-25 秒 + pending → 3-8 秒** へ短縮。Web 検索 (Mozilla pdf.js v5.4 / Nutrient 2026 guide) のベストプラクティスに従い、admin ポータルに `pdfjs-dist@^5.7` を導入。`src/lib/pdfThumbnail.ts` が File → 1 ページ目を `<canvas>` レンダリング → PNG base64 を返し、`uploadTrainingFile_` がそれを受け取って即時 Drive 保存。サーバ側の `generateAndSaveThumbnailForPdf_` polling は client 側失敗時の fallback として維持。admin bundle size +175KB (compressed)、member/public 不変。詳細: `docs/218_RELEASE_STATE_v351_2026-05-14.md`

> **2026-05-14 v350 反映済み**: v349 で残った「アップロード直後の Drive thumbnailLink が間に合わず thumbnailUrl='' のまま」事象を Web 検索のベストプラクティスで再評価し、(1) polling を `hasThumbnail` field + 5s×5回=最大 25 秒へ強化、(2) 10 分毎の `processPendingThumbnails` trigger を導入し大きい PDF を後追い backfill、(3) admin 編集モーダルに「サムネイル再生成」ボタン (`regenerateThumbnailForTraining` action) を追加。Playwright e2e で 24 秒で 24KB の base64 PNG 描画を確認。**operator 必須**: Apps Script editor で **`setupPendingThumbnailsTrigger` を 1 回 Run** して 10 分 trigger を登録すること。詳細: `docs/217_RELEASE_STATE_v350_2026-05-14.md`

> **2026-05-14 v349 反映済み**: 案内 PDF サムネイル問題を構造的に解消。真因は「過去アップロードの PDF は別 OAuth identity 所有 → 現 deployer から Drive REST `files.get` で 404」だった。`uploadTrainingFile_` 内でアップロード直後（同 identity = 確実に可視）に Drive thumbnailLink を取り、PNG として永続保存する pipeline に転換。`getFileThumbnail_` は PNG fileId から DriveApp.getBlob() するだけ。差し替え時の旧ファイル trash と、既存研修の MASTER 一括 backfill 関数 `regenerateAllThumbnails` を admin top-level として追加。詳細: `docs/216_RELEASE_STATE_v349_2026-05-14.md`

> **2026-05-14 v347 反映済み**: 案内 PDF サムネイル表示問題を本番ログ駆動で再再特定。v346 で Authorization ヘッダーを付与しても本番ログは `code=403` のままだった（`drive.google.com/thumbnail` は OAuth 付きでも PDF を拒否する）。`getFileThumbnail_` を Drive REST API v3 `files.get?fields=thumbnailLink` で取得した `lh3.googleusercontent.com/...` URL を Bearer 付き UrlFetchApp で取りに行く二段構えへ変更。Drive Web UI と同じ render pipeline が裏で動くため PDF にも対応。`drive` scope は 3 境界とも v296 時点で付与済み、追加 OAuth 再承認不要。`CacheService` 1h TTL は維持。integrated/public `@306` x2 / member split `@63` / admin split `@105`。詳細: `docs/215_RELEASE_STATE_v347_2026-05-14.md`

> **2026-05-13 v345 反映済み**: v344 で client 配線を完成させたが本番で「PDF プレビューを読み込めませんでした」が解消されず、Web 検索で真因を再確定。`DriveApp.getFileById(id).getThumbnail()` は PDF に対し常に `null` を返す Apps Script の既知制約だった。`gas-src/Code.full.gs:getFileThumbnail_` を `UrlFetchApp` で `drive.google.com/thumbnail?id=<id>&sz=w400` を取得して base64 へ変換する実装へ変更。Google の thumbnail CDN が PDF→画像変換を行うため PDF にもサムネイルが返る。`CacheService` で 1h キャッシュ。OAuth 追加スコープ不要。integrated/public `@304` x2 / member split `@61` / admin split `@103`。詳細: `docs/214_RELEASE_STATE_v345_2026-05-13.md`

> **2026-05-13 v344 反映済み**: 会員マイページ・公開ポータル・管理者ポータル全てで、案内 PDF サムネイル画像が壊れた画像アイコンになっていた事象を修正。真因は `T_研修.案内状サムネイルURL` の `drive.google.com/uc?export=view&id=...` URL を `<img src>` に直接渡していたが、Google が外部 hotlink を制限しているため画像取得が必ず失敗していたこと。v272 で server 側 proxy (`getFileThumbnail_`) は用意されていたが client 配線が抜け落ちていた。PdfThumbnail を base64 data URL fetch 化し、3 境界それぞれに `getFileThumbnail` action と allowlist を配線。integrated/public `@303` x2 / member split `@60` / admin split `@102`。詳細: `docs/213_RELEASE_STATE_v344_2026-05-13.md`

> **2026-05-13 v343 反映済み**: 管理者ポータル「登録済み管理者アカウント」一覧で、事業所職員紐付けの行の「表示名」列が権限ラベル（「マスター」「管理者」）だけになっていた事象を修正。`getAdminPermissionEntries_` が `memberMap[linkedMemberId]` だけを参照し、`T_認証アカウント.職員ID` 経由の事業所職員氏名を解決していなかったため、`staffMap[linkedStaffId]` も参照して `氏名（権限）` 形式へ統一。public / member artifact は変更なし。admin split `@101` のみ更新。詳細: `docs/212_RELEASE_STATE_v343_2026-05-13.md`

> **2026-05-13 v342 反映済み**: 2026-05-12 schema-shift incident (`docs/204`) の構造的再発防止策を全 3 プロジェクトへ反映。`writeSheetHeaders_` を name-based shift 対応にし、列追加・列名変更でデータ行が旧位置に残ることを防止。`auditDeleteFlagColumns_` を initializeSchema_ 末尾に追加し、削除フラグ列に boolean 以外の値があれば Logger へ警告。`docs/09_DEPLOYMENT_POLICY.md` に schema 変更 release 時の `runRebuildSchemaForV<N>` 手動実行と log 検査手順を追記。`DB_SCHEMA_VERSION` を `2026-05-13-schema-shift-guard-v1` に bump し、初回ヒット時に新 guard を本番シートに対して 1 回走らせる。詳細: `docs/211_RELEASE_STATE_v342_2026-05-13.md`

> **2026-05-13 v341 反映済み**: 年会費管理コンソールから会員名をクリックして会員詳細へ遷移する経路が、会員一覧未ロード時に「会員データが見つかりません。」となる問題を `src/App.tsx` で修正。`AnnualFeeAdminRecord.memberId` と `Member.id` はどちらも `T_会員.会員ID` でキー前提は一致。詳細遷移は `openMemberDetail()` で対象会員を取得し、React state 更新が次 render になる前提に合わせて詳細表示用 `Member` snapshot も保持する。member split `@58` / admin split `@99` へ fixed deployment 同期済み。public は変更なしで `@301` x2 維持。詳細: `docs/210_RELEASE_STATE_v341_2026-05-13.md`

> **🚨 引き継ぎ時に必ず読むこと**: `docs/204_INCIDENT_DB_SCHEMA_SHIFT_2026-05-12.md`
> v335 schema 変更時の data-shift マイグレーション未走に起因する DB データ scramble が発生。**T_会員 232 行と M_組織マスタ 8 行はすべて復旧完了**（バックアップ: `T_会員_backup_20260512_000201`、`M_組織マスタ_backup_20260512_014831`）。`全役員表示フラグ` の正しい値も UI 経由で 3 行設定済み。診断/復旧関数は `gas-src` / admin artifact から **clean 済み**。v337 cleanup release と admin fixed deployment `@95` 同期まで完了。

## 1. 現行状態

- `public / member / admin` の 3 境界は確定済み。
- 会員ログインは `loginId + password` のみ。
- 管理者ログインは Google アカウント + whitelist 検証のみ。
- 会員マイページに管理者ログイン導線を戻さない。
- fixed deployment 2本運用を維持し、片系だけ更新しない。
- production fixed deployment 同期は `npx clasp redeploy ... --versionNumber ... --description ...` を標準とする。
- split project の広範な関数本体 pruning は v283 で破損したため停止中。public artifact は v289 で comment/string を除外した依存解析と top-level callable allowlist 検査を導入済み。
- release 前に `npm run security:public-boundary` / `npm run security:split-boundary` を実行し、public/member/admin 境界が崩れていないことを確認する。
- member/admin split artifact の top-level callable は `doGet` / `processApiRequest` のみに制限済み。
- **v342（2026-05-13）**: DB schema-shift 構造的再発防止。`writeSheetHeaders_` を name-based shift 対応にして列追加時にデータ行を新 schema 位置へ自動 migrate。`auditDeleteFlagColumns_` で削除フラグ列の非 boolean 値を Logger 警告。`docs/09_DEPLOYMENT_POLICY.md` に schema 変更 release 時の `runRebuildSchemaForV<N>` 手動実行 / 警告ログ検査手順を追記。`DB_SCHEMA_VERSION = 2026-05-13-schema-shift-guard-v1`。integrated/public `@302` x2 / member split `@59` / admin split `@100`。詳細: `docs/211_RELEASE_STATE_v342_2026-05-13.md`。
- **v341（2026-05-13）**: 年会費管理コンソールから会員名をクリックして会員詳細へ遷移する経路を修正。`T_会員.会員ID` を正本キーとして維持しつつ、会員詳細表示用の `Member` snapshot を保持して、会員一覧未ロード時でも詳細を表示できるようにした。public は変更なし、member split `@58` / admin split `@99`。詳細: `docs/210_RELEASE_STATE_v341_2026-05-13.md`。
- **v320〜v332（2026-05-11）**: 全 3 ポータルで viewport meta + WCAG 2.2 AAA タップターゲット (44×44px) + iOS Safari モーダル UX + Sidebar モバイルドロアー + パスワード規約 (8〜20文字・許可文字制限) + `member_unauthorized` / `unsupported_action` の利用者向け平易表示を整備。Playwright 自動レスポンシブテスト **98/98 セル全合格** を達成。次担当者向け統合引継ぎ正本: `docs/199_RELEASE_STATE_v320_to_v332_2026-05-11.md`、テスト正本: `docs/198_RESPONSIVE_TEST_REPORT_2026-05-11.md`。
- **v333（2026-05-12）**: 役員向け請求を **活動報告 / 経費請求** の 2 系統へ分離。`M_業務分類`、`M_組織マスタ.全役員表示フラグ`、`T_請求.請求種別/業務分類コード/単価/数量` を追加。経費請求は添付必須、HEIC/HEIF は会員側で JPG 変換。public `@297` x2 / member split `@53` / admin split `@91`。詳細: `docs/200_RELEASE_STATE_v333_2026-05-12.md`。
- **v334（2026-05-12）**: 役員管理で状態変更（現職 / 退任済み）、役職、就任日、退任日、備考を編集可能化。役員管理ページの読み込み遅延原因だった不要な `fetchAllData` と `getOfficerMasterData` の重複取得を停止し、`getOfficerManagementData` 1 回で必要データを返す構成へ変更。public `@298` x2 / member split `@54` / admin split `@92`。詳細: `docs/201_RELEASE_STATE_v334_2026-05-12.md`。
- **v340（2026-05-12）**: 会員詳細編集画面のステータス欄に管理者専用 `ステータスメモ` を追加。`T_会員` 末尾列として追加し、会員マイページ・公開ポータルには出力しない。既存表ヘッダーを初期化前に上書きしない `ensureTableSheetsExist_` 経路と `DB_SCHEMA_VERSION=2026-05-12-member-status-note-v1` を反映。integrated/public `@301` x2 / member `@57` / admin `@98`。詳細: `docs/209_RELEASE_STATE_v340_2026-05-12.md`、`docs/208_MEMBER_STATUS_NOTE_2026-05-12.md`。
- **v338（2026-05-12）**: v336 の勤務先事業所名検索修正。admin dashboard / annual fee API の `officeName` を `T_会員.勤務先名` 参照へ修正し、cache key を更新。admin split `@96`。詳細: `docs/207_RELEASE_STATE_v338_2026-05-12.md`。
- **v337（2026-05-12）**: v335 schema-shift incident の診断/復旧関数 cleanup を admin fixed deployment `@95` へ反映。public / member は変更なし。詳細: `docs/205_RELEASE_STATE_v337_2026-05-12.md`。
- **v336（2026-05-12）**: 会員管理コンソール（会員一覧）と年会費管理コンソールのキーワード検索で、個人/賛助会員の勤務先事業所名でもヒットするよう `AdminDashboardMemberRow.officeName` / `AnnualFeeAdminRecord.officeName` を追加。会員一覧フィルタを共通 `matchesSearchQuery`（NFKC・case folding・全角/半角スペース除去・多語AND）に統一。admin split `@94`。詳細: `docs/203_RELEASE_STATE_v336_2026-05-12.md`。
- **v335（2026-05-12）**: 公開ポータルの新規入会申込を即時DB登録から `T_変更申請` の `MEMBER_APPLICATION` 承認待ちへ変更。`M_会員状態.TRANSFERRED`、`T_会員.移行日`、`T_人物統合ログ` を追加し、介護支援専門員番号が一致する個人/賛助会員・事業所職員間の移行時に認証・役員・振込口座・請求・研修申込を引き継ぐ。年会費履歴は会員レコード同士の重複修復時のみ移行。public `@299` x2 / member split `@55` / admin split `@93`。詳細: `docs/202_RELEASE_STATE_v335_2026-05-12.md`。

## 2. 最初に読む順序

1. `HANDOVER.md`
2. `AGENTS.md`
3. `GLOBAL_GROUND_RULES/docs/AI_RULES/05_PROJECT_RULES_HIRAKATA.md`
4. `GLOBAL_GROUND_RULES/docs/AI_RULES/00_OPERATING_MODEL.md`
5. `GLOBAL_GROUND_RULES/docs/AI_RULES/10_WORKFLOW_AND_QUALITY.md`
6. `GLOBAL_GROUND_RULES/docs/AI_RULES/20_SECURITY_APPROVALS.md`
7. `GLOBAL_GROUND_RULES/docs/AI_RULES/30_ERROR_MEMORY.md`
8. `GLOBAL_GROUND_RULES/docs/AI_RULES/40_DOCS_AND_TEACHING.md`
9. `docs/44_DEVELOPMENT_HANDOVER_PLAYBOOK_2026-04-04.md`
10. `docs/225_RELEASE_STATE_v360_to_v370_2026-05-17.md`（**最新本番：v370。integrated-public @329 x2 / member @87 / admin @129**）
11. `docs/221_RELEASE_STATE_v354_to_v358_2026-05-16.md`（v358。PDF lightbox 高解像度 PNG モーダル + v354〜v358 統合 release state。integrated-public @316 x2 / member @73 / admin @114）
11. `docs/220_RELEASE_STATE_v353_2026-05-15.md`（v353。会員マイページ「受付中の研修」A4 サムネイル UI 改修）
12. `docs/219_RELEASE_STATE_v352_2026-05-14.md`（v352。公開ポータル研修一覧 A4 サムネイル UI 改修）
11. `docs/217_RELEASE_STATE_v350_2026-05-14.md`（v350。サムネイル運用強化、member/admin は引き続き v350 / member @66 / admin @108）
12. `docs/218_RELEASE_STATE_v351_2026-05-14.md`（v351 = **ロールバック済み**。pdfjs-dist client-side レンダリングの試行録、罠と再挑戦方針）
12. `docs/216_RELEASE_STATE_v349_2026-05-14.md`（v349。アップロード時生成 + 永続化 pipeline / integrated-public @308 x2 / member @65 / admin @107）
12. `docs/215_RELEASE_STATE_v347_2026-05-14.md`（v347。案内 PDF サムネイル Drive REST + thumbnailLink 経路化（既存 PDF の identity 罠で未解消、v349 で構造改修） / integrated-public @306 x2 / member @63 / admin @105）
11. `docs/214_RELEASE_STATE_v345_2026-05-13.md`（v345。案内 PDF サムネイル真因再特定・UrlFetch 経由化（@304 で未解消）/ integrated-public @304 x2 / member @61 / admin @103）
12. `docs/213_RELEASE_STATE_v344_2026-05-13.md`（v344。案内 PDF サムネイル GAS proxy 化（DriveApp 経路） / integrated-public @303 x2 / member @60 / admin @102）
12. `docs/212_RELEASE_STATE_v343_2026-05-13.md`（v343。管理者一覧の事業所職員氏名表示修正 / admin @101）
12. `docs/211_RELEASE_STATE_v342_2026-05-13.md`（v342。DB schema-shift 構造的再発防止 / integrated-public @302 x2 / member @59 / admin @100）
11. `docs/210_RELEASE_STATE_v341_2026-05-13.md`（v341。年会費管理から会員詳細への遷移修正 / integrated-public @301 x2 / member @58 / admin @99）
12. `docs/209_RELEASE_STATE_v340_2026-05-12.md`（v340。会員ステータスメモ / schema initialization guard / integrated-public @301 x2 / member @57 / admin @98）
12. `docs/208_MEMBER_STATUS_NOTE_2026-05-12.md`（会員ステータスメモの実装・デプロイ記録）
13. `docs/207_RELEASE_STATE_v338_2026-05-12.md`（v338。勤務先事業所名検索修正 / admin split @96）
14. `docs/206_ADMIN_WORKPLACE_SEARCH_FIX_2026-05-12.md`（勤務先事業所名検索の原因調査と修正記録）
15. `docs/205_RELEASE_STATE_v337_2026-05-12.md`（v337。incident cleanup / admin split @95）
16. `docs/204_INCIDENT_DB_SCHEMA_SHIFT_2026-05-12.md`（v335 schema-shift incident。データ復旧済み、v337 cleanup release 完了）
17. `docs/203_RELEASE_STATE_v336_2026-05-12.md`（v336。勤務先事業所名検索 / admin split @94）
18. `docs/202_RELEASE_STATE_v335_2026-05-12.md`（v335 本番反映。入会申込キュー化 / 同一人物移行）
19. `docs/201_RELEASE_STATE_v334_2026-05-12.md`（v334 役員管理の状態編集 / 読み込み高速化）
20. `docs/200_RELEASE_STATE_v333_2026-05-12.md`（v333 本番反映。活動報告 / 経費請求 2系統化）
21. `docs/199_RELEASE_STATE_v320_to_v332_2026-05-11.md`（v320〜v332 統合・引継ぎ正本）
22. `docs/198_RESPONSIVE_TEST_REPORT_2026-05-11.md`（Playwright 自動レスポンシブテスト正本・98/98 セル合格）
23. `docs/197_RELEASE_STATE_v320_2026-05-11.md`（v320 初出時の経緯）
24. `docs/196_RELEASE_STATE_v311_to_v319_2026-05-09.md`（v311〜v319 統合）
25. `docs/195_RELEASE_STATE_v310_2026-05-08.md`
26. `docs/194_RELEASE_STATE_v309_2026-05-08.md`
27. `docs/193_RELEASE_STATE_v308_2026-05-06.md`
28. `docs/170_HANDOVER_SECURITY_SEPARATION_NEXT_2026-04-29.md`
29. `docs/172_DEFERRED_SECURITY_BACKLOG_SECRET_MANAGER_KDF_2026-05-01.md`
30. `docs/09_DEPLOYMENT_POLICY.md`
31. `docs/05_AUTH_AND_ROLE_SPEC.md`
32. `docs/04_DB_OPERATION_RUNBOOK.md`
33. `docs/03_DATA_MODEL.md`
34. `docs/00_DOC_INDEX.md`
35. `docs/archive/historical/20_NEXT_INSTRUCTIONS_FOR_CLAUDECODE_2026-03-19.md`（補足状態サマリ。正本は `HANDOVER.md`）

## 3. 配信境界

| 用途 | Project | Deployment ID | Access | Current version |
|---|---|---|---|---|
| 公開ポータル | integrated/public | `AKfycbxyuUXgK1oHUDMahQjluiL-gcrMK0qV0FWLFYaYBqGxlRSg9NhvmbyQRyf0dvaqg7Zp` | `ANYONE_ANONYMOUS` | `@341` |
| 公開ポータル legacy | integrated/public | `AKfycbywpWoYxij6A-ZunIeBjG1Q8qX78PMMTsT3frx1cM5PJ2nAuZpz81KruXb5LIvWgbQx` | `ANYONE_ANONYMOUS` | `@341` |
| 会員マイページ | member split | `AKfycbxd_6HlH5aWLhxYOtLUHehI3ODiHg4fpc5SCzNdEBIDbDpaBuU3KTuqDRbeBmhWZxSQ_g` | `ANYONE_ANONYMOUS` | `@99` |
| 管理者ポータル | admin split | `AKfycbwSCTTyvWY_cFG764XawdbqA8r0qxYbav4aDZ-BK9rRmvXHoUXrKQnQ9egRGqWcx4Os` | `DOMAIN` | `@145` |

## 4. 直近リリース

> v360〜v370 を時系列でひとまとめにした正本: **`docs/225_RELEASE_STATE_v360_to_v370_2026-05-17.md`**。HTML 概要: `docs/learning/16_system_overview_v370_2026-05-17.html`。

- **`v370.1`（2026-05-17 反映済み・admin HEAD push 経由）**: PENDING 入会申込の partial データ診断 + cleanup 関数を admin split に追加。`diagnoseStaleApplicationForV370(requestId?)` / `diagnoseAllStaleApplicationsForV370()` / `cleanupStaleBusinessApplicationForV370(memberId)` の 3 関数を Apps Script editor から実行可能。`scripts/audit-admin-boundary.mjs` と `scripts/build-admin-gas.mjs` の allowlist に追加。admin Code.gs は `clasp push --force` で HEAD 同期済み（editor は HEAD を実行するため version bump 不要）。fixed deployment は v370 のまま (`@129`)。
- **`v370`（2026-05-17 反映済み・緊急 hotfix）**: v368 の Logger.log 内で undefined 変数 `srcMemberId` を参照していたバグ修正（正しくは `sourceMemberId`）。事業所入会申込で既存個人会員と CM 番号一致した職員が含まれていた場合 ReferenceError でクラッシュ → 1 代表者のみ登録される現象を解消。integrated `@329` x2 / member `@87` / admin `@129`。
- **`v369`（2026-05-17 反映済み）**: v368 の 9 設定キーをシステム設定画面 UI から編集可能に。「入会・登録メール設定」サブビュー末尾に「変更申請ワークフロー」セクション追加（受付確認/承認通知/却下通知）+ 差込変数ガイド。integrated `@328` x2 / member `@86` / admin `@128`。
- **`v368`（2026-05-17 反映済み）**: (1) 個人/賛助→事業所職員転籍時の代表メアド必須を緩和（CM番号紐づけのみで通す）。(2) 申込/承認/却下メールをハードコードからシステム設定テンプレートへ移行。差込変数 9 種類対応 + 変更内容サマリー差込。9 新キー追加。integrated `@327` x2 / member `@85` / admin `@127`。
- **`v367`（2026-05-17 反映済み・緊急 bug fix）**: 変更申請の承認/却下が常に unauthorized で失敗していた重大不具合を修正。`adminSession.email` → `loginId`（4箇所）+ dispatcher で inner.success:false 伝播 + ChangeRequestConsole UX 修正。integrated `@326` x2 / member `@84` / admin `@126`。
- **`v366`（2026-05-17 反映済み）**: SharedMemoPanel を sm+ で sticky 化（年会費管理のみ）。IntersectionObserver で stuck 検知 → 自動 collapsed。モバイルは通常スクロール。integrated `@325` x2 / member `@83` / admin `@125`。
- **`v365`（2026-05-17 反映済み）**: 年会費一覧の会員名横にコピーボタン（CopyButton 汎用コンポーネント）追加。navigator.clipboard 優先 + execCommand fallback、1.5 秒アイコン切替フィードバック、aria-live + stopPropagation。integrated `@324` x2 / member `@82` / admin `@124`。
- **`v364`（2026-05-17 反映済み）**: 年会費管理コンソールで前年度未納行を red-50 背景 + 左ボーダー + ⚠ アイコン + テキストでハイライト。前年度在籍判定（isAnnualFeeEligibleMemberForYear_）で「対象外」を除外、UNPAID と未記録のみ警告対象。上部サマリに「前年度未納」カード追加。WCAG 2.2「色だけに頼らない」準拠。integrated `@323` x2 / member `@81` / admin `@123`。
- **`v363.2`（2026-05-16 反映済み）**: 会員詳細をモーダルダイアログ表示に変更（v363 新タブ廃止）。GAS DOMAIN 認証で毎回ログイン画面に戻る問題を回避。背景に元コンソール維持・✕/ESC/backdrop で閉じる。integrated `@322` x2 / member `@80` / admin `@122`。
- **`v363`（2026-05-16 反映済み・直後 v363.2 で改修）**: 会員詳細を新タブで開く試行。GAS DOMAIN 認証で再ログイン要求のため UX 不可。doGet APP_URL 注入と deepLink.ts は残置（将来 deep link 用）。
- **`v362`（2026-05-16 反映済み）**: 管理コンソール全検索のフリガナ対応。`matchesSearchQuery` に ひらがな→カタカナ統一 + NFC を追加。会員管理・年会費管理・一括メール送信・宛名リスト出力の検索値配列に `kana` 列追加（backend も同時対応）。`scripts/test-search.mts` で 16 ケース単体テスト。integrated `@320` x2 / member `@77` / admin `@118`。
- **`v361`（2026-05-16 反映済み）**: v360 hotfix。SheetJS xlsx の `import.meta` トラップで admin/member shell クラッシュ → xlsx 除去 + CSV (UTF-8 BOM) 出力 + `compress-html.mjs` に build 時 `import.meta` 検出 gate。
- **`v360`（2026-05-16 反映済み・データ migration のみ要 operator 実行）**: 研修名簿・出欠・受講履歴・一括メール明細を新設。M_出欠状態 / T_メール送信明細 / T_研修申込 2-FK 化（外部申込者ID 追加）+ 出欠 4 列。残作業: admin split で `runRebuildSchemaForV360` 手動 Run。詳細: `docs/223_RELEASE_STATE_v360_2026-05-16.md`、データモデル: `docs/learning/14_data_model_v360_2026-05-16.html`
- `v359`: 会員ログインを認証先行 + 遅延ロードへ変更。ログインID保存、パスワード表示/非表示、登録メールへのパスワード再設定コード送信を追加。integrated/public `@317` x2 / member `@74` / admin `@115`。詳細: `docs/222_RELEASE_STATE_v359_2026-05-16.md`
- `v358`: 案内 PDF lightbox プレビューを高解像度 PNG (w2000) モーダル化。CSP / Chrome blob / iOS Safari 制約を全て回避、1 ページ目を読める品質で表示し、全ページ閲覧は「別タブで開く」(Drive viewer) で。`extractDriveFileId_` 共通ヘルパーで全 URL 形式に対応 → `unparseable_url` 解消。integrated/public `@316` x2 / member `@73` / admin `@114`。
- `v357`: lightbox を blob URL iframe で実装 (Chrome ブロックで撤退 → v358 へ)。
- `v356`: PdfThumbnail の useEffect dep に fetchThumbnail が入っており「詳細を見る」開閉で再フェッチが起きていた問題を useRef パターンで修正 + 申込済み詳細パネルの PdfThumbnail を A4 縦比に統一。
- `v355`: lightbox を Drive `/preview` iframe で実装 (Drive 側 CSP `frame-ancestors` でブロック撤退 → v357 へ)。
- `v354`: v351 で残置した `pdfjs-dist` 依存 + `src/lib/pdfThumbnail.ts` + `TrainingManagement` の dynamic import を完全 purge。member shell の `Cannot use 'import.meta' outside a module` SyntaxError を構造的に解消。v354〜v358 の総括: `docs/221_RELEASE_STATE_v354_to_v358_2026-05-16.md`
- `v353`: 会員マイページ「受付中の研修」(`src/components/TrainingApply.tsx`) を A4 縦サムネイル + 詳細情報 2 カラムカード化。member split のみ更新。
- `v352`: 公開ポータル「現在受付中の研修」一覧を A4 縦 PDF サムネイル + 詳細情報 2 カラムカード化。サムネイルクリックで PDF オープン、日時/会場/主催/講師/定員/締切/参加費/問合せ先を semantic dl で明示。`PdfThumbnail` に `aspectRatio` prop 追加 (既存 height パス互換)。public のみ更新、member/admin は v350 のまま。integrated/public `@311` x2。
- **v351 (ROLLBACK)**: pdfjs-dist client-side レンダリング導入を試みたが、`import.meta` を含む node-only dead code が vite-plugin-singlefile の plain script 化と組み合わさり admin shell が parse 時 SyntaxError でクラッシュ。全 fixed deployment を v350 へ即時戻した。再挑戦課題として残置。
- `v351 (commits 606c520 / f1ed4be / 37d92c5, 本番未反映)`: 案内 PDF サムネイル即時化。`pdfjs-dist@^5.7` を admin に導入し、ブラウザの `<canvas>` で 1 ページ目をレンダリング → PNG base64 をアップロード時に同送、サーバは即時 Drive 保存。Drive thumbnailLink 待ち (20-25 秒) を完全排除し体感 **3-8 秒**。v350 サーバ polling 経路は fallback として維持。admin bundle +175KB (compressed)、member/public 不変。integrated/public `@310` x2 / member split `@67` / admin split `@109`。
- `v350`: 案内 PDF サムネイル運用強化。Web 検索ベストプラクティスに基づき (1) hasThumbnail polling + 5s×5 retry、(2) 10 分 trigger による後追い backfill (`processPendingThumbnails`)、(3) admin の手動「サムネイル再生成」ボタン (`regenerateThumbnailForTraining`) を追加。`setupPendingThumbnailsTrigger` を 1 回 Apps Script editor から Run する operator setup が必要。Playwright e2e で 24 秒/24KB 描画確認。integrated/public `@309` x2 / member split `@66` / admin split `@108`。
- `v349`: 案内 PDF サムネイル構造改修。アップロード時に PNG 1 ページ目を Drive に永続化（Tanaike pattern を簡素化）→ 表示時は DriveApp.getBlob() のみで identity 罠を回避。`saveTraining_` で差し替え時の旧ファイル GC、`regenerateAllThumbnails` で MASTER 一括 backfill。integrated/public `@308` x2 / member split `@65` / admin split `@107`。
- `v348`: 多経路フォールバック + 診断ログ追加（v349 に統合済み、参考）。integrated/public `@307` x2 / member split `@64` / admin split `@106`。
- `v347`: 案内 PDF サムネイル真因確定。Drive REST API v3 `files.get?fields=thumbnailLink` → `lh3.googleusercontent.com/...` を Bearer 付き UrlFetchApp で取得し base64 化。Drive Web UI と同じ render pipeline が PDF にも対応。`CacheService` 1h TTL 維持。integrated/public `@306` x2 / member split `@63` / admin split `@105`。
- `v346`: `drive.google.com/thumbnail` に Authorization ヘッダー追加（本番ログで効果なし、@305 のみ残置）。
- `v345`: 案内 PDF サムネイル真因再特定。`DriveApp.getThumbnail()` が PDF に対し常に null を返す Apps Script の既知制約のため、`getFileThumbnail_` を `UrlFetchApp(drive.google.com/thumbnail?id=...&sz=w400)` + base64 化へ書換。`CacheService` 1h キャッシュ。整 3 境界 ACL は v344 のまま。integrated/public `@304` x2 / member split `@61` / admin split `@103`。
- `v344`: 案内 PDF サムネイル画像が全 3 ポータルで表示されなかった問題を修正。`drive.google.com/uc?export=view&id=...` の hotlink 制限を回避するため、PdfThumbnail を GAS `getFileThumbnail` 経由の base64 data URL 取得に書き換え。3 境界 ACL / build allowlist / audit allowlist にも `getFileThumbnail` を追加。integrated/public `@303` x2 / member split `@60` / admin split `@102`。
- `v343`: 管理者ポータル「登録済み管理者アカウント」一覧の事業所職員紐付け行で「表示名」列が氏名なしになっていた問題を修正。`getAdminPermissionEntries_` で `staffMap[linkedStaffId]` も参照して `氏名（権限）` 形式へ統一。admin split `@101` のみ更新（public / member は変更なし）。
- `v342`: DB schema-shift 構造的再発防止。`writeSheetHeaders_` の name-based shift、`auditDeleteFlagColumns_` 追加、`docs/09` の deploy checklist 追記、`DB_SCHEMA_VERSION` bump。integrated/public `@302` x2 / member split `@59` / admin split `@100`。
- `v341`: 年会費管理コンソールから会員詳細への遷移を、会員一覧ロード状態に依存しない設計へ修正。`T_会員.会員ID` をキー正本として維持し、詳細表示用 `Member` snapshot を保持。public `@301` x2（変更なし） / member split `@58` / admin split `@99`。
- `v340`: 管理者専用の会員ステータスメモを追加。`T_会員.ステータスメモ` は末尾列として追加し、管理者コンソールのみ表示・保存。会員マイページ・公開ポータルには出力しない。schema initialization guard を反映し、既存テーブルのヘッダー上書き前に name-based migration が走るよう修正。integrated/public `@301` x2 / member split `@57` / admin split `@98`。
- `v338`: 管理者ポータルの会員一覧・年会費管理で、個人/賛助会員の勤務先事業所名検索が効かない不具合を修正。admin dashboard / annual fee API の `officeName` を `T_会員.勤務先名` 参照へ修正し、admin dashboard cache key を更新。admin split `@96`。
- `v337`: v335 schema-shift incident の診断/復旧関数 cleanup を admin fixed deployment `@95` へ反映。public / member は変更なし。
- `v336`: 会員管理コンソール（会員一覧）と年会費管理コンソールのキーワード検索で、個人/賛助会員の勤務先事業所名でもヒットするよう改善。`AdminDashboardMemberRow.officeName` / `AnnualFeeAdminRecord.officeName` を追加。会員一覧フィルタを共通 `matchesSearchQuery`（NFKC正規化・case folding・スペース除去・多語AND）に統一。admin split `@94`。
- `v335`: 入会申込を承認待ちキュー化し、同一人物移行で旧個人/賛助会員を `TRANSFERRED`、旧事業所職員を `LEFT` とする。`T_人物統合ログ` へ移行結果を記録。public `@299` x2 / member split `@55` / admin split `@93`。
- `v334`: 役員管理で状態変更（現職 / 退任済み）、役職、就任日、退任日、備考を編集可能化。役員管理ページの不要な `fetchAllData` と `getOfficerMasterData` 重複取得を停止。public `@298` x2 / member split `@54` / admin split `@92`。
- `v333`: 役員向け請求を活動報告 / 経費請求の 2 系統へ分離。活動報告は活動部 + 業務分類から単価を確定し数量 1 固定、経費請求は自由記載 + 半角数値金額 + 添付必須。組織の全役員表示フラグ、業務分類マスタ、HEIC/HEIF→JPG 変換、管理者確認 UI を追加。public `@297` x2 / member split `@53` / admin split `@91`。リリース前バックアップは Execution API 権限不足で未実施、ユーザー承認によりスプレッドシート版歴を復旧手段として続行。
- `v332`: ユーザビリティ・要件改善。**(1) パスワード規約**: 上限を 19 → 20 文字に拡張（8〜20 文字、20文字以下）。規約案内パネルからセキュリティ理由文（XSS / インジェクション対策説明・禁止文字一覧の根拠）を削除し、エンドユーザー視点の「使える文字」のみに集約。**(2) `member_unauthorized` 解消**: `api.getOfficerMasterData()` が会員側からの呼び出し時に sessionToken を渡していなかった問題を修正。**(3) ClaimCard エラー表示の平易化**: 生エラーコード（`member_unauthorized` / `member_session_expired` / `unsupported_action`）を利用者向け日本語メッセージに置換し、警告色（amber）で「請求情報を読み込めませんでした」とタイトル付き表示に。public `@296` / member split `@52` / admin split `@90`。
- `v331`: **パスワード変更フローの仕様改訂** — `PASSWORD_MIN_LENGTH=8` / `PASSWORD_MAX_LENGTH=19` の範囲制約、許可文字を半角英数 + 安全記号 (`! @ # $ % ^ * ( ) _ + - = [ ] { } ; : , . ? / | ~`) のみに制限。エスケープ可能な記号 (`\` `` ` `` `'` `"` `<` `>` `&`) は禁止しインジェクション・XSS 対策。検証メッセージはパスワード変更モーダル内に表示（`role="alert"` + 規約パネル）。サーバー側 `changePassword_` も同等の検証を実施。初期生成パスワードは `PASSWORD_GENERATED_LENGTH=15` 固定で従来動作維持。**役員会員の `unsupported_action` エラー解消** — `getOfficerMasterData` を `MEMBER_ALLOWED_ACTIONS` に追加（請求フォーム描画用の読み取り専用マスタ参照）。boundary audit / handler / 関数ミラーを更新。public `@295` / member split `@51` / admin split `@89`。なお v332 で `PASSWORD_MAX_LENGTH` は 20 に再調整。
- `v330`: 宛名リスト出力コンソールの検索欄レイアウト breakpoint を `md` → `lg` に変更し、768px (iPad portrait) で検索 input が極小化される問題を解消。Admin 56 セル / Member 21 セル / Public 21 セルの計 **98 セル全合格**を達成。詳細: `docs/198_RESPONSIVE_TEST_REPORT_2026-05-11.md`。admin split `@88`。
- `v329`: システム設定ページのサブナビをモバイル時に横スクロールタブバー化し、320px で本体コンテンツが圧縮される問題を解消。admin split `@87`。
- `v328`: グローバル `@layer base` の `button` に `min-width: 44px` を追加（v327 で追加した `min-height: 44px` を拡張）。ページネーション・アイコンボタン等の小型ボタン幅も WCAG 2.2 AAA 準拠に。admin split `@86` のみ更新。
- `v327`: 全 `<button>` 要素にグローバル `min-height: 44px` を `@layer base` で追加（v326 の input/select/textarea 対応を拡張）。`scripts/responsive-test-admin.mjs` の sidebar グループ展開ロジックも修正。member split `@50` / admin split `@85`。
- `v326`: 認証要 (member/admin) ポータルのモバイル UX 全面強化。Sidebar をモバイル時ドロアー（ハンバーガー＋backdrop overlay）化、Tailwind base layer に `input/select/textarea { min-height: 44px }` を追加してフォーム要素を 44px AAA 基準に統一、Sidebar nav/ログアウト/グループヘッダーに `min-h-[44px]`、`<main>` を `p-4 md:p-8` に変更。Member ポータルで 7 viewport (320–1920px) × 3 view (login/profile/training) の Playwright 自動テスト 21 セル全合格を確認。member split `@49` / admin split `@84`。
- `v325`: MemberForm / TrainingApply の主要 CTA（パスワード変更 / 詳細を見る / 案内 PDF / 会員情報を確認・変更 / 申し込み / 最新情報を取得 / 案内 PDF を全ページ開く）に `min-h-[44px]`。member split `@48`。
- `v324`: 認証要シェル（member / admin）のサイドバーをモバイル時にドロアー化（`fixed inset-y-0` + `transform translate-x-*` + backdrop overlay + ハンバーガーボタン）。`<main>` を `p-4 md:p-8` に変更。Sidebar nav / ログアウト / グループヘッダーに `min-h-[44px]`。ログインフォームと管理者 Google ログインボタンも 44px 化。member split `@47` / admin split `@83`。
- `v323`: Playwright (chromium) を導入し、公開ポータルに対する自動レスポンシブテストを 7 viewport (320–1920px) × 3 view で実施。初回測定で見つかった WCAG 2.2 AAA 未達のタップターゲット (`← ポータルトップへ戻る` / `重要事項を確認する` / ダイアログ header `閉じる` / `入会・退会案内を開く` / `定款を確認する`) を `min-h-[44px]` + `min-w-[44px]` に揃え、再測定で 21 セル全合格を確認。テスト基準・結果は `docs/198_RESPONSIVE_TEST_REPORT_2026-05-11.md` 参照。`scripts/responsive-test.mjs` で再実行可能。integrated/public `@294` x2 のみ更新。
- `v322`: 入会申込画面「事務局からのお願い（ご入会にあたって）」モーダルがスマホで `max-h-[90vh]` + 固定 calc 高さで組まれており、iOS Safari のアドレスバー領域分だけフッターが画面下にはみ出して「内容を確認して閉じる／閉じる」ボタンに到達できない不具合を修正。flex column レイアウト + `max-h-[100dvh]` (sm 以上は `90dvh`) + `flex-1 min-h-0 overflow-y-auto` ボディに変更し、フッターは `shrink-0` + `pb-[max(1rem,env(safe-area-inset-bottom))]` で safe area を確保。タップターゲットも `min-h-[44px]` 化。integrated/public `@293` x2 のみ更新。
- `v321`: v320 hotfix。GAS `HtmlOutput.addMetaTag()` は `viewport` / `apple-mobile-web-app-capable` / `mobile-web-app-capable` / `google-site-verification` のみ許可で、`theme-color` を渡すと `Exception: 指定したメタタグはこのコンテキストでは使用できません` で全ページ表示不可になっていたため、`theme-color` の addMetaTag 呼び出しを 3 プロジェクトから除去。viewport は維持。integrated/public `@292` x2 / member split `@46` / admin split `@82`。
- `v320`: 全 3 プロジェクト（public/member/admin）の `doGet()` に `addMetaTag('viewport', ...)` および `addMetaTag('theme-color', ...)` を追加し、スマートフォンでの白ページを解消。公開ポータルを mobile-first レスポンシブ UX（`100dvh`・`overflow-x-hidden`・`sm:grid-cols-2`・カード段階サイズ・ヘッダー/フッター stack・WCAG 2.2 タップターゲット 44px）に強化。AGENTS.md にレスポンシブ必須グランドルールを追加。integrated/public `@291` x2 / member split `@45` / admin split `@81`。詳細: `docs/197_RELEASE_STATE_v320_2026-05-11.md`
- `v319-post`: 第三者評価指摘の修正（`annualFeeStatus` 型から `NONE` 除去、`MailingListExport` の dead entry 削除、`processRosterChunk_` の `|| 'NONE'` → `|| 'UNPAID'`）を反映。admin split `@80`。詳細: `docs/196_RELEASE_STATE_v311_to_v319_2026-05-09.md`
- `v319`: 管理者ポータルにパンくずナビ（グループ名 › コンソール名）と変更申請 PENDING バッジを追加。admin split `@79`。詳細: `docs/196_RELEASE_STATE_v311_to_v319_2026-05-09.md`
- `v318`: システム設定ページを 5 カテゴリ左サブナビ + 1 カテゴリ集中表示に変更。admin split `@78`。詳細: `docs/196_RELEASE_STATE_v311_to_v319_2026-05-09.md`
- `v317`: サイドバーナビを 5 グループ化・折りたたみ・開閉状態保存に対応。admin split `@77`。詳細: `docs/196_RELEASE_STATE_v311_to_v319_2026-05-09.md`
- `v316`: テンプレートライブラリを無制限登録・検索選択・自動マイグレーションに対応。admin split `@76`。詳細: `docs/196_RELEASE_STATE_v311_to_v319_2026-05-09.md`
- `v315`: 名簿出力コンソール事業所会員の氏名表示を事業所名のみに修正。admin split `@75`。詳細: `docs/196_RELEASE_STATE_v311_to_v319_2026-05-09.md`
- `v314`: 名簿出力年会費ステータスの `NONE` を廃止し未納に統一（データ整合性修正）。admin split `@74`。詳細: `docs/196_RELEASE_STATE_v311_to_v319_2026-05-09.md`
- `v313`: 名簿出力コンソールを自動ロード・クライアント側フィルタリング・テーブル表示バグ修正。admin split `@73`。詳細: `docs/196_RELEASE_STATE_v311_to_v319_2026-05-09.md`
- `v312`: 名簿出力コンソールに在籍判定年度ドロップダウン＋年会費多年度条件ビルダーを追加（宛名リストと同仕様）。admin split `@72`。詳細: `docs/196_RELEASE_STATE_v311_to_v319_2026-05-09.md`
- `v311`: 宛名リスト年会費フィルターの初期値を選択年度・全状態にデフォルト設定。admin split `@71`。詳細: `docs/196_RELEASE_STATE_v311_to_v319_2026-05-09.md`
- `v310`: 宛名リスト出力コンソールの年会費納入フィルターを、複数年度・AND条件に対応した条件ビルダーに刷新。admin split `@70`。詳細: `docs/195_RELEASE_STATE_v310_2026-05-08.md`
- `v309`: 年会費管理コンソールに管理者共有申し送りメモ（ホワイトボード型）を追加。MASTER/ADMIN が書き込み可、60秒自動ポーリング＋手動更新、楽観的排他制御。admin split `@69`。詳細: `docs/194_RELEASE_STATE_v309_2026-05-08.md`
- `v308`: 会員詳細編集画面の年会費表示を 2024 年度以降、当年度から過去 4 年分へ修正。admin split `@68`。詳細: `docs/193_RELEASE_STATE_v308_2026-05-06.md`
- `v307`: 会員詳細編集画面に年会費の表示・編集セクションを追加。admin split `@67`。詳細: `docs/192_RELEASE_STATE_v307_2026-05-06.md`
- `v306`: 管理コンソール保存後再読込の `unsupported_action` fatal error を防止。admin split `@66`。詳細: `docs/190_RELEASE_STATE_v306_2026-05-06.md`
- `v305`: 宛名リスト・名簿出力の年度基準判定と共有検索を修正。admin split `@65`。詳細: `docs/188_RELEASE_STATE_v305_2026-05-05.md`
- `v304`: 会員管理コンソールの事業所職員一覧 UI を修正。admin split `@64`。詳細: `docs/186_RELEASE_STATE_v304_2026-05-05.md`
- `v303`: `adminDashboard` 旧 cache が `staffRows` なしで残る場合の再生成 guard を追加。admin split `@63`。詳細: `docs/184_RELEASE_STATE_v303_2026-05-04.md`
- `v302`: 事業所職員一覧を `T_事業所職員` 由来の `staffRows` で表示するよう修正。admin split `@62`。詳細: `docs/183_RELEASE_STATE_v302_2026-05-04.md`
- `v301`: v300 相当の admin artifact を再生成し、管理者 fixed deployment を再同期。admin split `@61`。詳細: `docs/182_RELEASE_STATE_v301_2026-05-04.md`
- `v300`: 事業所会員ビューを事業所職員一覧へ修正。admin split `@60`。詳細: `docs/181_RELEASE_STATE_v300_2026-05-04.md`
- `v299`: 会員管理コンソールに事業所会員ビューを追加。admin split `@59`。詳細: `docs/180_RELEASE_STATE_v299_2026-05-04.md`
- `v298`: 振込口座管理タブの事業所職員役員対応を修正。admin split `@58`。詳細: `docs/178_RELEASE_STATE_v298_2026-05-04.md`
- `v297`: 事業所職員を役員に割当て可能にし、関連 DB 3 テーブルへ `職員ID` を追加。member split `@44` / admin split `@57`。詳細: `docs/177_RELEASE_STATE_v297_2026-05-04.md`
- `v291`: パスワード保存を versioned PBKDF2-HMAC-SHA256 + verifier-side pepper へ更新し、split boundary audit を prerelease gate 化。詳細: `docs/173_RELEASE_STATE_v291_2026-05-01.md`

## 5. 既知の重要事項

- `seedDemoData` は production DB を破壊する操作として扱い、完全バックアップと明示承認なしでは実行しない。
- business member の代表者情報は `staff.role='REPRESENTATIVE'` を正本とする。
- `PASSWORD_HASH_PEPPER_V1` は integrated/public・member split・admin split の 3 project に同一値で設定済みという前提で運用する。値は Git、handover、docs、ログ、チャット、生成物へ記録しない。
- Secret Manager 化および外部 KDF / managed identity の検討は必須 security backlog。完了または明示的な代替設計決定まで削除・完了扱いにしない。詳細: `docs/172_DEFERRED_SECURITY_BACKLOG_SECRET_MANAGER_KDF_2026-05-01.md`
- `v288` 第三者評価で検出された public callable `rebuildDatabaseSchema` / `getDbInfo` は v289 で public artifact から除去済み。
- DriveApp 障害は解決済み。根本原因は GCP 標準 Cloud project `hcmn-member-system-prod` で Google Drive API が未有効化だったこと。詳細: `docs/153_INCIDENT_DRIVE_PERMISSION_2026-04-27.md`
- admin split `@47` は whiteout 実績があるため、原因特定まで admin physical pruning の再デプロイは禁止。

## 6. DB とスキーマ状態

- 本番 DB スプレッドシート ID: `1GVlIzOG1Tsqw8fBXgZ__c8u4oMu-4_WCf0H3aVLESKs`（固定・変更禁止）
- ログ SS ID: `1NmVv483UeehF8dqCdyNKOqOtv_fPKROhHN7011N23lw`
- v295 DB マイグレーションは 2026-05-03 に Apps Script エディタ（admin split）から `runRebuildSchemaForV295` を手動実行済み。
- v297 DB マイグレーションは 2026-05-04 に Apps Script エディタ（admin split）から `runRebuildSchemaForV297` を手動実行済み。
- v335 は DB スキーマ変更あり。`initializeSchemaIfNeeded_()` により初回 WebApp ロード時に `M_会員状態.TRANSFERRED`、`T_会員.移行日`、`T_人物統合ログ` が差分正規化される。操作者側で初回ロード後のシート確認が必要。
- v305 / v306 / v307 / v308 は物理 DB スキーマ変更なし。v305 は `getMemberFiscalSnapshot_()` による年度基準派生モデルの修正、v306 は管理コンソール再読込状態管理の修正、v307/v308 は既存年会費 API を使う会員詳細 UI と表示年度修正のみ。
- `T_役員` / `T_振込口座` / `T_請求` の人物識別は `会員ID` または `職員ID` の XOR 制約を守る。

## 7. 操作者確認待ち

実ブラウザ確認は操作者側で実施する。

### 最優先（v341 関連）
- **年会費管理 → 会員詳細遷移**: 管理者ポータルで、会員管理の会員一覧を開かない状態から年会費管理へ入り、会員名をクリックして会員詳細が開くこと。「会員データが見つかりません。」が表示されないこと。
- **保存後の安定性**: 遷移後の会員詳細で任意の非破壊項目を確認し、保存または戻る操作後も画面が破綻しないこと。

### 最優先（v320〜v332 関連）
- **モバイル実機確認**: iPhone Safari / Android Chrome（端末幅 360〜414px）で公開ポータル・会員マイページ・管理者ポータルにアクセスし、白ページが解消され、サイドバーがハンバーガーメニュー → ドロアー展開でき、各 CTA が指で押せるサイズ（≧44px）で表示されることを確認。
- **パスワード変更**: 会員マイページ → パスワード変更モーダルで、規約パネル（8〜20 文字・許可文字一覧）が見え、不正値を入力すると **モーダル内** に警告が表示されることを確認。
- **役員ステータスカード**: 役員会員（広報組織化委員長など）でログインし、`unsupported_action` / `member_unauthorized` のエラーが表示されず、振込口座と請求情報が正常に読み込まれることを確認。
- **VoiceOver / TalkBack**: 任意フェーズ。サイドバードロアーとモーダルがスクリーンリーダー操作可能であること。

### 既存（v311〜v319 関連、未確認分）
- 会員マイページ OAuth 再承認: member split に `drive` scope が追加済みのため、未実施環境では再承認が必要。
- v319: サイドバーが5グループで折りたたみ表示される。変更申請がある場合にバッジが表示される。各コンソールにパンくずが表示される。
- v318: システム設定が5カテゴリのサブナビで1カテゴリずつ表示される。保存ボタンは引き続き全設定一括保存。
- v317: サイドバーグループの開閉状態がリロード後も保持される。MASTER専用項目に🔒が表示される。
- v316: システム設定のテンプレートライブラリにテンプレートを追加・検証・デフォルト設定でき、名簿出力で選択できる。初回アクセス時に旧2枠設定が自動移行される。
- v313〜v315: 名簿出力が自動読み込みされ「対象外」が表示されず「未納」に統一される。事業所会員が事業所名で表示される。
- v312: 名簿出力の年会費条件ビルダーで複数年度AND絞り込みができる。
- v311: 宛名リスト読み込み後に年会費フィルターに現在年度が自動設定される。
- v309: 年会費管理コンソールで申し送りメモパネルが表示・保存・自動更新される。

## 8. 次担当者の最初の一手

1. `git status -sb` で既存差分、未追跡ファイル、`origin/main` との差分を確認する。
2. **次の 3 件を必ず読む**:
   - `AGENTS.md`（特に **§0 シークレット最優先絶対ルール** と §4 レスポンシブ必須）
   - `HANDOVER.md`（本文書）
   - `docs/232_RELEASE_STATE_v372.9_ROSTER_S2_DRAG_DROP_2026-05-20.md`（最新本番 release state）
3. `.clasp.json` は Git 追跡対象外。`gas/admin/.clasp.json` / `gas/member/.clasp.json` がローカルに無い環境では、値をチャットや docs に出さず、各自ローカルで作成する。
4. `git diff --check` / `npm run typecheck` / `npm run security:public-boundary` / `npm run security:split-boundary` / `npm run test:search` を再実行して、整理済み環境を確認する。
5. テストハーネス前提を整える（必要に応じて）:
   - Member テスト: `.env.test.example` を `.env.test` にコピーし、`MEMBER_LOGIN_ID` / `MEMBER_PASSWORD` をユーザー側で埋める（ロックされていないテスト用アカウントを使用）。
   - Admin テスト: `node scripts/auth-bootstrap-admin.mjs` で Google ログイン → `.test-out/auth-admin.json` を作成（通常 1〜2 週間有効）。
   - これらの認証情報は **絶対にチャット・コミット・ログ・ドキュメントに値を再掲しない**（§0）。
6. 実装・構成・デプロイ前に不明点を確認する。複数解釈が成立する場合は推測で実装せず、YesNo か選択肢で答えられる形で質問する。
7. 変更前に関連正本を読み、コード・データ・デプロイ・UI・認証・運用手順を変える場合は同ターンで正本を更新する。
8. 本番系 `clasp` コマンドは最初から承認済みの安定経路で実行する。
9. リリース完了条件: `build → push → version → fixed deployment sync → verification → document update`（§5）。
10. リリース後、可能なら `node scripts/responsive-test*.mjs` でレスポンシブ品質に後退がないことを確認。

## 9. 標準確認コマンド

```bash
git status --short
git diff
npm run typecheck
npm run build:gas
npm run security:public-boundary
npm run security:split-boundary
```

レスポンシブ後退を防ぐための自動テスト（任意・要 .env.test / .test-out/auth-admin.json）:

```bash
node scripts/responsive-test.mjs         # 公開ポータル
node scripts/responsive-test-member.mjs  # 会員マイページ
node scripts/responsive-test-admin.mjs   # 管理者ポータル
```

本番反映時は `docs/09_DEPLOYMENT_POLICY.md` の `build -> push -> version -> fixed deployment sync -> verification -> document update` を完了条件とする。

## 10. 進行中インシデント / 未完了タスク（最優先）

### 10.1 DB schema-shift incident（2026-05-12 発生 / データ復旧 100% 完了 / cleanup release 完了）

正本: `docs/204_INCIDENT_DB_SCHEMA_SHIFT_2026-05-12.md`

**完了済み**:
- ✅ T_会員 232 行: `repairSchemaShiftForV336` で右シフト復旧（backup: `T_会員_backup_20260512_000201`）
- ✅ M_組織マスタ 8 行: 同関数で復旧（backup: `M_組織マスタ_backup_20260512_014831`）
- ✅ `全役員表示フラグ` の 3 行（HQ / DIRECTORS / SECRETARIAT を `表示=true`）を Playwright MCP 経由で UI から設定
- ✅ T_請求 / T_振込口座 / T_変更申請: データなし（lastRow=1）→ 修正不要
- ✅ T_役員: 8 行存在、kind 検出で全列正常整合確認 → 修正不要
- ✅ T_事業所職員 / T_認証アカウント / T_研修 / T_年会費納入履歴 / M_役職マスタ 等: v288 以降 schema 変更なし → 影響なし
- ✅ 診断/復旧関数（`diagnoseTKaiInSchemaForV336`, `diagnoseTKaiInSchemaForV336deep`, `repairSchemaShiftForV336`, `seedOrgMasterFullDisplayFlagsForV336`）を `gas-src/Code.full.gs` から削除（cleanup commit `1da2fa2` 済み）
- ✅ `scripts/build-admin-gas.mjs` と `scripts/audit-admin-boundary.mjs` の allowlist から関数名を削除
- ✅ `npm run typecheck` / `build:gas:admin` / `security:admin-boundary` / `security:member-boundary` / `security:public-boundary`: すべて PASS

**v337 cleanup release 完了済み**:
- Git push: `origin/main` へ反映済み
- admin split `npx clasp push --force`: 成功
- Apps Script version: `95`
- admin fixed deployment: `AKfycbwSCTTyvWY_cFG764XawdbqA8r0qxYbav4aDZ-BK9rRmvXHoUXrKQnQ9egRGqWcx4Os @95`
- `npx clasp deployments --json`: 対象 deployment が `versionNumber: 95`, `description: "v337 cleanup"` であることを確認

**残作業**:
- 操作者側の実ブラウザ確認（管理者ポータル MASTER ログイン、会員一覧・組織マスタ正常表示）
- バックアップシートは 2026-05-26 まで残置推奨
- v338 以降で schema 列追加時の再発防止策を実装

**clasp 認証の落とし穴（既知事象）**:
- `clasp push` は **標準 OAuth** (`k.noguchi@hcm-n.org` 直接ログイン) でしか通らない
- `clasp run` は **project-scoped OAuth** (`.tmp/oauth-client-hcmn-member-system-prod.json` + `--use-project-scopes`) でしか通らない
- v337 は push のみで `clasp run` は不要なので、標準 OAuth 1 回で完結する
- 同 session で両方を使う必要がある場合は `clasp logout` → 別の `clasp login` で都度切替

**今後の再発防止策（v338 以降で対応推奨）**:

根本原因は `writeSheetHeaders_`（`gas-src/Code.full.gs:12432` 付近、ファイル変動で要再検索）が schema 列追加時に **header 行だけを setValues で上書きし、データ行の name-based shift を行わない**こと。
具体的には:
- `createMasterSheets_` / `createTableSheets_` → `writeSheetHeaders_` の順で header だけ上書き
- 続く `normalizeTableColumns_` が `currentHeaders === targetHeaders` を真と判定して早期 return
- 結果: data-shift マイグレーションが全くスキップされる

**修正案**:
1. `initializeSchema_` で `createTableSheets_` より **前** に `normalizeTableColumns_` を呼ぶ
2. または `writeSheetHeaders_` 内で「header 長 / 名前の差異」を検出した場合に内部で name-based shift を実行
3. `削除フラグ` カラムが `true/false` 以外を含む場合に warning ログを出す sanity check
4. release checklist の deploy checklist に schema 変更時の `runRebuildSchemaForV<N>` 手動実行を追記

詳細は `docs/204_INCIDENT_DB_SCHEMA_SHIFT_2026-05-12.md` §再発防止策。

### 10.2 v336 文書（参考）

`docs/203_RELEASE_STATE_v336_2026-05-12.md`: キーワード検索の勤務先事業所名対応。fixed deployment `@94` 反映済み。v336 自体は incident と別件。
