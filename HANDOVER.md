# 開発引継ぎ

更新日: 2026-05-14
現行本番: `v350`（v351 を import.meta SyntaxError で **ロールバック**、`v350` に戻す） / integrated-public GAS version `309` / member split GAS version `66` / admin split GAS version `108`
fixed deployment: integrated/public `@309` x2 / member split `@66` / admin split `@108`

> **2026-05-14 v351 ロールバック完了**: v351 で導入した `pdfjs-dist` の dynamic import が、`vite-plugin-singlefile` のデフォルト挙動（bundle を plain `<script>` 化）と組み合わさり、`pdfjs-dist/build/pdf.mjs:9421` の `import.meta.url`（Node 専用 dead code）が parse 時に `Uncaught SyntaxError: Cannot use 'import.meta' outside a module` を投げ、admin shell 全体がクラッシュ。4 fixed deployment を全て v350 (`@309 x2 / @66 / @108`) へ即時 redeploy 戻しした。GAS Apps Script コードと build artifact は v351 commit 群（`606c520 / f1ed4be / 37d92c5`）として git に残るが、本番には未反映。再挑戦時は `@rollup/plugin-replace` で pdfjs-dist 内の `import.meta.url` をリテラル置換するなど、Vite bundle 構成側の対策が必要。罠詳細: `memory/feedback_pdfjs_dist_vite_singlefile_trap.md`

> **2026-05-14 v350 反映済み (現行本番)**: 案内 PDF サムネイルの生成時間を **20-25 秒 + pending → 3-8 秒** へ短縮。Web 検索 (Mozilla pdf.js v5.4 / Nutrient 2026 guide) のベストプラクティスに従い、admin ポータルに `pdfjs-dist@^5.7` を導入。`src/lib/pdfThumbnail.ts` が File → 1 ページ目を `<canvas>` レンダリング → PNG base64 を返し、`uploadTrainingFile_` がそれを受け取って即時 Drive 保存。サーバ側の `generateAndSaveThumbnailForPdf_` polling は client 側失敗時の fallback として維持。admin bundle size +175KB (compressed)、member/public 不変。詳細: `docs/218_RELEASE_STATE_v351_2026-05-14.md`

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
10. `docs/217_RELEASE_STATE_v350_2026-05-14.md`（**最新本番：v350。hasThumbnail polling + trigger backfill + 再生成ボタン / integrated-public @309 x2 / member @66 / admin @108**）
11. `docs/218_RELEASE_STATE_v351_2026-05-14.md`（v351 = **ロールバック済み**。pdfjs-dist client-side レンダリングの試行録、罠と再挑戦方針）
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
| 公開ポータル | integrated/public | `AKfycbxyuUXgK1oHUDMahQjluiL-gcrMK0qV0FWLFYaYBqGxlRSg9NhvmbyQRyf0dvaqg7Zp` | `ANYONE_ANONYMOUS` | `@309` |
| 公開ポータル legacy | integrated/public | `AKfycbywpWoYxij6A-ZunIeBjG1Q8qX78PMMTsT3frx1cM5PJ2nAuZpz81KruXb5LIvWgbQx` | `ANYONE_ANONYMOUS` | `@309` |
| 会員マイページ | member split | `AKfycbxd_6HlH5aWLhxYOtLUHehI3ODiHg4fpc5SCzNdEBIDbDpaBuU3KTuqDRbeBmhWZxSQ_g` | `ANYONE_ANONYMOUS` | `@66` |
| 管理者ポータル | admin split | `AKfycbwSCTTyvWY_cFG764XawdbqA8r0qxYbav4aDZ-BK9rRmvXHoUXrKQnQ9egRGqWcx4Os` | `DOMAIN` | `@108` |

## 4. 直近リリース

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
   - `docs/217_RELEASE_STATE_v350_2026-05-14.md`（最新本番 release state）
3. テストハーネス前提を整える（必要に応じて）:
   - Member テスト: `.env.test.example` を `.env.test` にコピーし、`MEMBER_LOGIN_ID` / `MEMBER_PASSWORD` をユーザー側で埋める（ロックされていないテスト用アカウントを使用）。
   - Admin テスト: `node scripts/auth-bootstrap-admin.mjs` で Google ログイン → `.test-out/auth-admin.json` を作成（通常 1〜2 週間有効）。
   - これらの認証情報は **絶対にチャット・コミット・ログ・ドキュメントに値を再掲しない**（§0）。
4. 実装・構成・デプロイ前に不明点を確認する。複数解釈が成立する場合は推測で実装せず、YesNo か選択肢で答えられる形で質問する。
5. 変更前に関連正本を読み、コード・データ・デプロイ・UI・認証・運用手順を変える場合は同ターンで正本を更新する。
6. 本番系 `clasp` コマンドは最初から承認済みの安定経路で実行する。
7. リリース完了条件: `build → push → version → fixed deployment sync → verification → document update`（§5）。
8. リリース後、可能なら `node scripts/responsive-test*.mjs` でレスポンシブ品質に後退がないことを確認。

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
