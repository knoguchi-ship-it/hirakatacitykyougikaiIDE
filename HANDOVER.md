# 開発引継ぎ

更新日: 2026-04-15
現行本番: `v208`
固定 deployment: member `@208` / public `@208`
補足: v208 で宛名リスト2バグ修正（事業所会員の名前→勤務先名、住所不備シートのflush漏れ）。v207 で宛名リスト Excel 出力コンソール追加。
次期開発: なし（SOW完了）→ `docs/63_SOW_ROSTER_PDF_AND_BULK_MAIL_2026-04-10.md`

## 1. 最初に読むもの
1. `HANDOVER.md`
2. `AGENTS.md`
3. `GLOBAL_GROUND_RULES/docs/AI_RULES/05_PROJECT_RULES_HIRAKATA.md`
4. `docs/44_DEVELOPMENT_HANDOVER_PLAYBOOK_2026-04-04.md`
5. `docs/79_HANDOVER_2026-04-15.md` ← **引継ぎ資料（v208時点）** — 機能一覧・運用・落とし穴まとめ
6. `docs/78_RELEASE_STATE_v208_2026-04-15.md` ← **v208 current**（宛名リスト バグ修正）
7. `docs/77_RELEASE_STATE_v207_2026-04-15.md`（v207 record）
8. `docs/76_RELEASE_STATE_v206_2026-04-15.md`（v206 record）
9. `docs/75_RELEASE_STATE_v205_2026-04-14.md`（v205 record）
10. `docs/63_SOW_ROSTER_PDF_AND_BULK_MAIL_2026-04-10.md` ← **全フェーズ完了（Phase 1〜3）**
11. `docs/58_NEXT_TASK_PERFORMANCE_2026-04-09.md`（B-02 未着手・残課題）
12. `docs/09_DEPLOYMENT_POLICY.md`
13. `docs/05_AUTH_AND_ROLE_SPEC.md`
14. `docs/04_DB_OPERATION_RUNBOOK.md`
15. `docs/03_DATA_MODEL.md`
- v197〜v204 記録: `docs/archive/release_history/`（67〜74）
- v170〜v196 記録: `docs/archive/release_history/`（45〜66）

## 2. 現在の引継ぎ結論
- 開発の入口は `HANDOVER.md`、運用手順の正本は `docs/44_DEVELOPMENT_HANDOVER_PLAYBOOK_2026-04-04.md`。
- 本番状態の判断は `HANDOVER.md`、作業の進め方と完了条件は `docs/44_DEVELOPMENT_HANDOVER_PLAYBOOK_2026-04-04.md` に記録する。
- 最新の release state 文書は `HANDOVER.md` の「最初に読むもの」に記載されたものを参照する。
- task 単位の個票は `docs/31_HANDOVER_TASK_TEMPLATE.md` を複製して管理する。
- 2026-04-10 の引継ぎ確認ログは `docs/65_HANDOVER_TASK_DEV_SETUP_2026-04-10.md` を参照する。

## 3. 現在の本番状態
- ブランチ運用の基準は `main`。
- 両 fixed deployment は `@208` を向いている。
- fixed deployment の標準同期方法は `npx clasp redeploy`。Apps Script UI `Manage deployments` は障害復旧時の補助手段に限定する。
- member portal は sidebar logout を採用済み。
- デモログイン、mock member route、画面内 demo selector は廃止済み。
- business member は `REPRESENTATIVE` 行を代表者情報の正本とする。
- 個人会員 / 居宅介護支援事業者所属でない会員は、`officeName` が空または `????` の場合に所属なしとして正規化する。
- デモアカウント（本番DB）: `demo-ind-001` / `demo1234`（個人会員）、`demo-ind-002` / `demo1234`（個人会員）。
- 管理者ログイン: `checkAdminBySession`（auth のみ）。会員データは遷移後の遅延取得。
- フロントエンド HTML 圧縮: deflate-raw + base64（`scripts/compress-html.mjs`）。member 206 kB / public 150 kB。

## 4. 直近の重要履歴
### v208
- 2026-04-15 宛名リスト2バグ修正。build:gas / push / version / fixed deployment sync 実施。
- **Bug 1**: 事業所会員の名前が`姓名`になっていた → `勤務先名`に修正
- **Bug 2**: 住所不備シートに書き込んでも xlsx に反映されない → `setValues()` 後に `SpreadsheetApp.flush()` を追加（GAS 書き込みバッファのフラッシュ漏れ）
- `npm run typecheck`、`npm run build:gas`、`npx clasp deployments --json`（両 deployment @208）確認済み。

### v207
- 2026-04-15 宛名リスト Excel 出力コンソール（MailingListExport）を追加。build:gas / push / version / fixed deployment sync 実施。
- **GAS backend**: `generateMailingListExcel_()` / `_fillMailingSheet_()` 新規追加
  - 発送区分: 広報誌発送（KOHOUSHI）= ACTIVE+WITHDRAWAL_SCHEDULED 全員 / お知らせ発送（OSHIRASE）= 事業所全員 + POST希望の個人・賛助
  - 住所解決: 事業所会員は勤務先*、個人/賛助は郵送先区分コードに従い勤務先*または自宅*
  - 都道府県: 大阪府は出力せず、他府県のみ表示
  - 住所不備（郵便番号・市区町村・番地のいずれか欠損）は 住所不備 シートへ分離
  - xlsx エクスポート: 一時 SS → UrlFetchApp Bearer token → base64 → 一時 SS 削除（drive スコープ使用）
  - シート構成: 事業所会員 / 個人会員 / 賛助会員 / 住所不備
- **フロントエンド**: `src/components/MailingListExport.tsx` 新規作成
  - 発送区分ラジオ選択（広報誌発送/お知らせ発送）
  - 出力・ダウンロードボタン（base64 → Blob → a.click() パターン）
  - 出力完了後に件数サマリー（4分類 + 住所不備件数強調）
- **Sidebar**: 「宛名リスト出力コンソール」メニュー追加（roster-export の次、isFullAdmin）
- **App.tsx**: `'mailing-list-export'` view ルーティング追加
- `npm run typecheck`、`npm run build:gas`、`npx clasp deployments --json`（両 deployment @207）確認済み。

### v206
- 2026-04-15 T_会員 に住所2列（建物名）を追加。build:gas / push / version / fixed deployment sync 実施。
- **GAS backend**: `テーブル定義.T_会員` に `勤務先住所2` / `自宅住所2` 追加
  - `fetchAllDataFromDb_()` / `createMember_()` / `submitMemberApplication_()` / `updateMember_()` に新列マッピング追加
  - `MEMBER_WRITABLE_FIELDS_` / `ADMIN_MEMBER_WRITABLE_FIELDS_` に `officeAddressLine2` / `homeAddressLine2` 追加（OWASP Mass Assignment 対策 allowlist）
  - `addAddressLine2Columns()` マイグレーション関数追加（冪等・本番DBへの列挿入）
- **フロントエンド**: `MemberForm.tsx` / `MemberDetailAdmin.tsx` で「番地・建物名」を「番地」と「建物名・部屋番号（任意）」の2フィールドに分割
- **TypeScript**: `Member.officeAddressLine2?` / `Member.homeAddressLine2?` 追加
- **DB適用**: `npx clasp run addAddressLine2Columns` を実行して本番DBに列を追加すること
- `npm run typecheck`、`npm run build:gas`、`npx clasp deployments --json`（両 deployment @206）確認済み。

### v205
- 2026-04-14 PDF出力1000件対応アーキテクチャへ刷新。build:gas / push / version / fixed deployment sync 実施。
- **GAS backend**: `generateRosterZip_` を5関数に完全分解（chunked + all-or-nothing + retry）
  - `initRosterExport_`: Drive 一時フォルダ作成（jobId 兼用）
  - `processRosterChunk_`: 250件/チャンク、PARALLEL_BATCH=15、MAX_RETRY=2リトライ
  - `finalizeRosterExport_`: 部分ZIP を unzip + rezip で最終1ファイルに統合
  - `cleanupRosterExport_`: エラー・中断時の一時フォルダ削除
  - `generatePdfsForIds_`: コアPDF生成ヘルパー（failedIds を返してリトライ制御を上位へ委譲）
- **フロントエンド**: `RosterExport.tsx` にチャンク分割フロー + プログレスバー追加
  - CHUNK_SIZE=250 でフロントが分割し processRosterChunk を順次呼ぶ
  - チャンク進捗バー（現在チャンク/総チャンク + 件数）
  - all-or-nothing のため部分成功 UI を廃止
- **api.ts**: `generateRosterZip` 廃止、4新メソッドに置き換え
- 件数耐性: 203件(現在)=1チャンク ✅ / 500件=2チャンク ✅ / 1000件=4チャンク ✅
- `npm run typecheck`、`npm run build:gas`、`npx clasp deployments --json`（両 deployment @205）確認済み。

### v204
- 2026-04-14 名簿PDF出力の50件上限を廃止。build:gas / push / version / fixed deployment sync 実施。
- **GAS backend**: `generateRosterZip_` を並列バッチ処理に全面改修
  - 50件ハード上限（`ROSTER_PDF_MAX_BATCH`）を廃止
  - `PARALLEL_BATCH=10` の一時 SS を使い回し、`UrlFetchApp.fetchAll()` で並列 PDF 取得
  - 会員種別ソートで `showSheet/hideSheet` 呼び出し回数を最小化
  - 203件想定: ~8s/バッチ × ~14バッチ ≈ 2〜3分（GAS 6分制限内）
- **フロントエンド**: `src/components/RosterExport.tsx` の overLimit ロジックを完全除去
  - `ROSTER_MAX_BATCH` 定数・`overLimit` 変数・警告バッジ・ボタン無効化条件を削除
  - 生成スピナーに「並列処理中・数分かかる場合あり」注意文を追加
- `npm run typecheck`、`npm run build:gas`、`npx clasp deployments --json`（両 deployment `@204`）確認済み。

### v203
- 2026-04-10 Phase 3（PDF名簿出力コンソール）完了。SOW全フェーズ完了。
- **GAS backend**: `getMembersForRoster_` / `generateRosterZip_` 実装
  - `getMembersForRoster_`: T_会員フィルタ（種別・在籍状態・年会費ステータス）、BUSINESS は在籍職員数を付加
  - `generateRosterZip_`: テンプレートSS一時コピー→`_DATA`シート書き込み→flush()→PDF→Utilities.zip→Drive保存→URL返却
  - 職員ソート: REPRESENTATIVE→ADMIN→STAFF、最大50件超は警告のみ（分割はユーザー操作）
- **フロントエンド**: `src/components/RosterExport.tsx` 新規作成
  - フィルタパネル（種別チェック・在籍状態・年会費ステータス・年度）
  - 対象一覧（チェックボックス・null=全選択パターン・種別ごと全選択・50件超overLimit警告）
  - ZIP生成スピナー・DLリンク・エラー一覧・`_DATA`シート列マッピングインラインガイド
- **Sidebar**: 「名簿出力コンソール」メニュー追加（bulk-mailの次、isFullAdmin）
- **App.tsx**: `'roster-export'` view ルーティング追加
- `npm run typecheck`、`npm run build:gas`、`npx clasp run healthCheck` 通過。

### v195
- 2026-04-10 Phase 2（会員一括メール送信コンソール）完了。
- **GAS backend**: `getMembersForBulkMail_` / `sendBulkMemberMail_` / `getEmailSendLog_` 実装
  - INDIVIDUAL/SUPPORT: T_会員.代表メールアドレス、BUSINESS: T_事業所職員（メール配信希望コード ≠ 'NO'）
  - GmailApp.sendEmail（from エイリアス）+ Drive自動添付（姓名部分一致）+ T_メール送信ログ記録
  - getEmailSendLog_: EMAIL_LOG_VIEWER_ROLE による動的権限チェック
- **フロントエンド**: `src/components/BulkMailSender.tsx` 新規作成
  - フィルタパネル（種別・在籍状態・メール配信希望・メール未登録除外）
  - 宛先一覧（チェックボックス全選択/解除・opt-out警告）
  - 差し込みタグメールエディタ（{{氏名}} {{事業所名}} {{会員番号}}）
  - エイリアスセレクト・共通添付・個人別添付・Drive自動添付ON/OFF
  - 送信確認ダイアログ・送信結果・autoAttachMissed一覧・送信ログ閲覧
- **Sidebar**: 「一括メール送信コンソール」メニュー追加（isFullAdmin）
- **App.tsx**: `bulk-mail` view ルーティング追加
- `npm run typecheck`、`npm run build:gas`、`npx clasp run healthCheck` 通過。

### v194
- 2026-04-10 Phase 1（基盤整備）完了。build:gas / push / version / fixed deployment sync 実施。
- **OAuthスコープ追加**: `gmail.send`（GmailApp エイリアス送信）、`drive`（Drive フルアクセス）。
  - **本番管理者の再認証が必要**（次回 /exec アクセス時に Google の同意画面が表示される）
- **T_メール送信ログ シート新設**: `createEmailLogSheet` 実行で DB に追加（9列）
- **T_システム設定 3キー追加**: `insertSystemSettingKeysForV194` 実行で追加
  - `ROSTER_TEMPLATE_SS_ID`（初期値: 空）
  - `BULK_MAIL_AUTO_ATTACH_FOLDER_ID`（初期値: 空）
  - `EMAIL_LOG_VIEWER_ROLE`（初期値: `MASTER`）
- **`updateSystemSettings_` キー別権限チェック追加**: `EMAIL_LOG_VIEWER_ROLE` は MASTER のみ変更可
- **システム設定画面に3項目追加**: MASTER のみ `EMAIL_LOG_VIEWER_ROLE` セレクトが表示される
- `npm run typecheck`、`npm run build:gas`、`npx clasp run healthCheck` 通過。

### v193
- 2026-04-09 build:gas / push / version / fixed deployment sync を実施。
- **管理者認証キャッシュ**: `checkAdminBySession_()` でホワイトリスト・認証アカウント行を `CacheService.getScriptCache()` にキャッシュ（TTL 300秒）。
  - ウォームインスタンスでの管理者ログインが高速化（sheet 直読み → キャッシュヒット）
  - 会員名の表示は `fetchAllDataFromDb_()` キャッシュから取得（キャッシュ未存在時は従来どおり直読み）
  - ホワイトリスト変更時（save/delete）にキャッシュを即時無効化
- fixed deployment 2 本は `npx clasp redeploy` で `@193` に同期した。
- `npm run typecheck`、`npm run build:gas`、`npx clasp run healthCheck` 通過。

### v192
- 2026-04-09 build:gas / push / version / fixed deployment sync を実施。
- **管理者ログイン修正**: `handleAdminSessionLogin` が `adminLoginWithData`（auth + portal data 一括）を呼んでいたのを `checkAdminBySession`（auth のみ）に変更。
  - 管理者ログイン後の会員リスト読み込みは遅延取得（ページ遷移時に必要なデータのみロード）
  - Playwright 確認: 管理者コンソール（176会員・SVGチャート）が正常表示

### v191
- 2026-04-09 build:gas / push / version / fixed deployment sync を実施。
- **カスタム HTML 圧縮**: `scripts/compress-html.mjs` 新設。
  - `vite-plugin-singlefile` 出力の `<script type="module">` を deflate-raw + base64 に圧縮
  - ブラウザ側は `DecompressionStream('deflate-raw')` で展開し `new Function(t)()` で実行
  - GAS CSP 互換（`blob:` import を使わず `unsafe-eval` 許容の `new Function` で実行）
  - `build-gas.mjs` に圧縮ステップを追加し `npm run build:gas` で自動実行
  - member portal: 522 kB → 206 kB (-59.6%)
  - public portal: 317 kB → 150 kB (-51.7%)
- fixed deployment 2 本は `npx clasp redeploy` で `@191` に同期した。
- `npm run typecheck`、`npm run build:gas`、`npx clasp run healthCheck` 通過。
- ブラウザ実確認: v192 で Playwright にて管理コンソール（176会員・SVGチャート）の正常表示を確認済み。

### v190
- 2026-04-09 build:gas / push / version / fixed deployment sync を実施。
- `vite-plugin-singlefile` を復元（v189 の blob: import が GAS CSP でブロックされ画面真っ白）。

### v189
- **失敗**: `vite-plugin-singlefile-compression` の `import(blob:...)` が GAS CSP でブロックされ画面真っ白。v190 で即時復旧。
- 2026-04-09 build:gas / push / version / fixed deployment sync を実施。
- **フロントエンド HTML 圧縮 (Approach B)**:
  - `vite-plugin-singlefile` を `vite-plugin-singlefile-compression` v2.2.3 に置換
  - deflate-raw + Base128 ビルド時圧縮 → ブラウザ実行時に DecompressionStream で展開（Chrome 80+ 対応）
  - Vite 6 互換 bug を `patches/vite-plugin-singlefile-compression+2.2.3.patch` で修正、`postinstall: patch-package` で自動適用
  - member portal: 521 kB → 149 kB (-71%)
  - public portal: 317 kB → 98 kB (-69%)
- fixed deployment 2 本は `npx clasp redeploy` で `@189` に同期した。
- `npm run typecheck`、`npm run build:gas`、`npx clasp run healthCheck` 通過。
- **残作業**: B-02 未着手。ブラウザで両ポータルの表示・操作を実確認すること。

### v188
- 2026-04-09 build:gas / push / version / fixed deployment sync を実施。
- **パフォーマンス改善 Phase 1-2**:
  - B-03: `warmUp()` を `SpreadsheetApp.openById + fetchAllDataFromDb_()` に強化（コールドスタート抑制）
  - B-01: `getMemberPortalData_()` の T_研修 全件スキャンを廃止し、申込済み + 今後開催分のみフィルタ
  - B-04: キャッシュ TTL 300 → 600秒（`ALL_DATA_CACHE_TTL_SECONDS`, `ANNUAL_FEE_CACHE_TTL_SECONDS`）
  - B-05: `openMemberDetail` がデータ既読時に force reload をスキップするよう最適化
  - B-06: `recharts` を純 SVG 実装に置換（外部依存除去）
  - Terser minification を vite.config.ts に追加（2パス最適化）
  - Gemini AI をフロントエンドから GAS サーバー側 (`generateTrainingEmailWithAI_`) に移行、API キーは Script Properties で管理
- バンドルサイズ改善: member portal gzip 131.01 → 127.75 kB (-2.5%)
- fixed deployment 2 本は `npx clasp redeploy` で `@188` に同期した。
- `npm run typecheck`、`npm run build:gas`、`npx clasp run healthCheck` 通過。
- **残作業**: GEMINI_API_KEY を Script Properties に手動設定（AI機能を使う場合）。B-02 は未着手。

### v187
- 2026-04-09 build:gas / push / version / fixed deployment sync を実施。
- 研修フォーム（`TrainingManagement.tsx`）: 「法定外研修として登録する」チェックボックスを研修タイトル上部へ移動。
- 設定画面（`App.tsx`）: 保存ボタンを設定カード下部の sticky バーに変更（`sticky bottom-0`）。スクロール中も常時表示。primary カラーで視認性を向上。
- fixed deployment 2 本は `npx clasp redeploy` で `@187` に同期した。
- `npm run typecheck`、`npm run build:gas` 通過。

### v186
- 2026-04-09 build:gas / push / version / fixed deployment sync を実施。
- 研修フォーム（`TrainingManagement.tsx`）UX 大幅改善:
  1. **費用非表示時 = 参加費無料ラベル**: `fees` フィールドが非表示の場合、フォーム内に緑色の「参加費無料」ラベルを表示。
  2. **申込日デフォルト自動入力**: 新規研修登録時、申込開始日=当日・申込締切日=1か月後をデフォルト入力。
  3. **問い合わせ連絡先を電話番号・メールアドレスに分割**: `inquiryPhone` + `inquiryEmail` の 2 フィールド。どちらか一方必須。後方互換で旧 `inquiryContactValue` 読み込み対応。
  4. **法定外研修フラグ常時表示**: 表示/非表示トグルを廃止し、チェックボックスのみを常時表示。
  5. **研修項目表示デフォルト設定画面**: システム設定画面に `TRAINING_DEFAULT_FIELD_CONFIG` 設定チェックボックスを追加。新規登録時にデフォルト項目表示を制御可能。
- バックエンド変更:
  - `parseTrainingOptions_` / `serializeTrainingOptions_` に `inquiryPhone` / `inquiryEmail` を追加。
  - `normalizeInquiryContacts_` 関数を新設し後方互換を保持。
  - `getSystemSettings_` / `updateSystemSettings_` に `trainingDefaultFieldConfig` を追加。
- `src/types.ts`: `Training` に `inquiryPhone?` / `inquiryEmail?` を追加、`SystemSettings` に `trainingDefaultFieldConfig?` を追加。
- fixed deployment 2 本は `npx clasp redeploy` で `@186` に同期した。
- `npm run typecheck`、`npm run build:gas` 通過。

### v185
- 2026-04-09 build:gas / push / version / fixed deployment sync を実施。
- 年会費管理コンソール（`AnnualFeeManagement.tsx`）の状態セレクトで「納入済み」を選択した際、入金日（`confirmedDate`）に本日の日付を ISO 形式で自動設定し、表示欄（`rawDateTexts`）にも YYYY/MM/DD 形式で即時反映するよう変更。
- fixed deployment 2 本は `npx clasp redeploy` で `@185` に同期した。
- `npm run typecheck`、`npm run build:gas`、`npx clasp run healthCheck` 通過。

### v184
- 2026-04-09 build:gas / push / version / fixed deployment sync を実施。
- 会員一括編集画面（`MemberBatchEditor.tsx`）に 2 機能を追加。
  1. **氏名/ID クリックで詳細編集ページへ遷移**: `onOpenDetail` が渡されている場合、名前セルをボタン化。クリックで `onOpenDetail(person.memberId)` を呼び、個別詳細画面へ遷移。事業所職員の場合は親会員の詳細ページへ遷移する。
  2. **状態変更時の日付自動入力**: 退会済み → 退会日=前年度末（`currentFY-03-31`）、退会予定 → 退会日=今年度末（`currentFY+1-03-31`）、在籍/在籍中 → 退会日クリア・入会日=今日。退職済み（LEFT）も前年度末を自動入力。会計年度は 4 月始まりで計算。
- fixed deployment 2 本は `npx clasp redeploy` で `@184` に同期した。
- `npm run typecheck`、`npm run build:gas`、`npx clasp run healthCheck` 通過。

### v183
- 2026-04-09 build:gas / push / version / fixed deployment sync を実施。
- データ移行期バリデーション緩和を全編集フォームへ拡張。対象: `MemberForm.tsx`（会員自身の編集）、`MemberDetailAdmin.tsx`（管理者による会員編集）。`StaffDetailAdmin.tsx` は v182 で対応済み。
- `MemberForm.tsx`: `useMemo` で `initiallyEmptyFields`（メンバーレベル）と `initiallyEmptyStaffFields`（職員ごと、staff.id キー）を管理。`validate()` 内の全必須チェックにガードを追加。対象フィールド: 氏名・フリガナ・介護支援専門員番号・電話番号・メール・事業所住所各項目・自宅住所各項目・職員氏名・職員フリガナ。
- `MemberDetailAdmin.tsx`: `individualRequiredFields`（介護支援専門員番号）の `validateField` に originValue ガードを追加（`businessRequiredFields` は v126 で対応済み）。
- fixed deployment 2 本は `npx clasp redeploy` で `@183` に同期した。
- `npm run typecheck`、`npm run build:gas`、`npx clasp run healthCheck` 通過。

### v182
- 2026-04-09 build:gas / push / version / fixed deployment sync を実施。
- 職員編集フォーム（`StaffDetailAdmin.tsx`）のバリデーション修正。元々 DB が空である必須フィールド（メールアドレス・介護支援専門員番号等）は空白のまま保存できるよう変更。データが既に入っているフィールドは従来どおり空白不可。`initiallyEmptyRequired` Set を用いて初期値の空否を判定する。
- fixed deployment 2 本は `npx clasp redeploy` で `@182` に同期した。
- `npm run typecheck`、`npm run build:gas`、`npx clasp run healthCheck` 通過。

### v181
- 2026-04-09 build:gas / push / version / fixed deployment sync を実施。
- `resolveAnnualFeeSelectedYear_` のデフォルト年度算出を修正。旧実装は `T_年会費納入履歴` の最新年度を返していたため、新年度開始直後にレコードがない場合に前年度（2025）が表示されるバグがあった。`getCurrentFiscalYear_()` を直接返すよう変更し、常に現在の会計年度（4月始まり）をデフォルトとする。
- フロントエンドの `CURRENT_YEAR` も会計年度ロジック（4月始まり）に統一。
- fixed deployment 2 本は `npx clasp redeploy` で `@181` に同期した。

### v180
- 2026-04-09 build:gas / push / version / fixed deployment sync を実施。
- 年会費管理コンソールのデフォルトフィルタを変更: 納入状況 `すべて→未納`、ソートキー `会員名→年度処理`。
- 年度処理（status）の昇順ソートを「未納(UNPAID)=0 / 納入済み(PAID)=1」の優先度マップで定義し、昇順で未納が最上位になるよう修正。
- fixed deployment 2 本は `npx clasp redeploy` で `@180` に同期した。

### v179
- 2026-04-09 build:gas / push / version / fixed deployment sync を実施。
- `mapMembersForApi_` 関数に `ss` パラメータが欠落しており、`getAnnualFeeTransferAccountSetting_(ss)` で "ss is not defined" エラーが発生してログインできない不具合を修正。`mapMembersForApi_(ss, ...)` にシグネチャを変更し、2 つの呼び出し元も合わせて修正した。
- fixed deployment 2 本は `npx clasp redeploy` で `@179` に同期した。
- `npx clasp deployments --json`、`npx clasp run healthCheck` で反映確認済み。

### v178
- 2026-04-09 build / build:gas / push / version / fixed deployment sync を実施。
- 管理コンソールの事業所職員数カウントを修正。旧実装はポータルデータ（ログインユーザーの組織のみ）を参照していたため、全組織合計でなく自組織の職員数しか表示されていなかった。バックエンドで各事業所の在籍職員数（`enrolledStaffCount`）を `memberSummaries` に含め、フロントエンドは `filteredAdminMemberRows` から集計するよう変更した。
- 会員一覧のデフォルトフィルタを「全期間・全種別・在籍中」から「最新年度・全種別・在籍中」に変更した。`hasFilteredView` の判定もデフォルト値基準に合わせた。
- fixed deployment 2 本は `npx clasp redeploy` で `@178` に同期した。
- `npx clasp deployments --json`、`npx clasp run healthCheck`、`npx clasp run getDbInfo` で反映確認済み。

### v177
- 2026-04-08 build / build:gas / push / version / fixed deployment sync を実施。
- 未納時の共通振込先を `T_システム設定.ANNUAL_FEE_TRANSFER_ACCOUNT` で管理できるようにし、設定変更が会員マイページの振込先表示へ反映されるよう修正した。
- 現在の会員ステータスにログイン中本人の氏名を表示するよう修正した。
- fixed deployment 2 本は `npx clasp redeploy` で `@177` に同期した。
- `npx clasp deployments --json`、`npx clasp run healthCheck`、`npx clasp run getDbInfo` で反映確認済み。

### v176
- 2026-04-08 build / build:gas / push / version / fixed deployment sync を実施。
- 年会費対象会員について、当年度レコードが未作成でも会員マイページでは当年度を `未納` として先頭表示するよう修正した。
- fixed deployment 2 本は `npx clasp redeploy` で `@176` に同期した。
- `npx clasp deployments --json`、`npx clasp run healthCheck`、`npx clasp run getDbInfo` で反映確認済み。

### v175
- 2026-04-08 build:gas / push / version / fixed deployment sync を実施。
- 会員向け画面に残っていた `管理コンソール` などの管理者目線文言を利用者向けの閲覧専用表現へ置換した。
- fixed deployment 2 本は `npx clasp redeploy` で `@175` に同期した。
- `npx clasp deployments --json`、`npx clasp run healthCheck`、`npx clasp run getDbInfo` で反映確認済み。

### v173
- 2026-04-07 build / build:gas / push / version / fixed deployment sync を実施。
- 事業所会員の会員ステータス・入会日は、管理コンソール専用項目としてグレーアウト表示に整理した。
- 事業所会員の事業所情報は `REPRESENTATIVE` のみ編集可能に変更し、非代表者には閲覧専用であることを明示した。
- 事業所名下の開発者向け補足文言を削除した。
- `npx clasp deployments --json`、`npx clasp run healthCheck`、`npx clasp run getDbInfo` で反映確認済み。

### v172
- 2026-04-07 build / build:gas / push / version / fixed deployment sync を実施。
- 事業所会員の代表者情報で、編集不可の利用者には入力欄をグレーアウトして閲覧専用であることを明示した。
- 事業所会員の会員ステータスは編集 UI を廃止し、表示テキストのみに変更した。
- 事業所会員の入会日はグレーアウトした表示専用フィールドに統一した。
- `npx clasp deployments --json`、`npx clasp run healthCheck`、`npx clasp run getDbInfo` で反映確認済み。

### v171
- 2026-04-06 build / build:gas / push / version / fixed deployment sync を実施。
- 事業所会員の代表者情報を `REPRESENTATIVE` 本人のみ編集可能に変更。
- 事業所会員の `ADMIN` は代表者情報を閲覧のみに変更し、代表者行の状態・権限変更を会員マイページから不可にした。
- 事業所会員の会員ステータス・入会日は会員マイページで表示のみに変更。
- `WITHDRAWAL_SCHEDULED` の場合、退会予定日を会員マイページで表示するようにした。
- `npx clasp deployments --json`、`npx clasp run healthCheck`、`npx clasp run getDbInfo` で反映確認済み。

### v170
- 2026-04-04 build / push / version / fixed deployment sync を実施。
- 管理コンソールの年度別会員表示で、過去年度時点で在籍していた退会者が current status により除外される不具合を修正。
- ダッシュボードの `ALL` 選択時ヘッダーを最新年度ではなく `全期間` 表示に修正。
- `npx clasp deployments --json`、`npx clasp run healthCheck`、`npx clasp run getDbInfo` で反映確認済み。
- その後、2026-04-04 中にユーザーが DB 復旧作業をロールバックし、現在の本番 DB は整合性が取れている前提に更新。

### v169
- 2026-04-04 build / push 実施。
- 2026-03-26 時点の外部バックアップから DB を復元。
- `appendRowsByHeaders_` の復旧系不具合を修正。
- 復旧支援用 helper を追加。
- fixed deployment 反映は未実施。

### v168
- 2026-04-03 に fixed deployment まで反映済み。
- `backend/Code.gs` の欠落事故から復旧し、`v167` の変更を安全に再適用。

### v167
- business `ADMIN` の role 変更ルールを実装。
- `updateMemberSelf_` の欠落初期化不具合を修正。
- テスト仕様は `docs/41_TEST_SPEC_v167_BUSINESS_ADMIN_ROLE_CHANGE.md` を参照。

## 5. 現時点の注意事項（v208 更新）
- fixed deployment 2 本は `@208` を向いている。
- **v206 DB 適用済み**: `npx clasp run addAddressLine2Columns` は実行完了。本番 `T_会員` に `勤務先住所2` / `自宅住所2` 列が追加されている。
- **v194 リリース済みのため、本番管理者（k.noguchi@uguisunosato.or.jp）は次回 /exec アクセス時に gmail.send + drive の同意画面が表示される。** 未承認の場合は必ず承認すること。
- **名簿出力コンソール（RosterExport）使用前提条件**: システム設定画面で `ROSTER_TEMPLATE_SS_ID`（テンプレートスプレッドシートID）を登録すること。未登録時は「テンプレートSS IDがシステム設定に登録されていません」と表示される。
- **一括メール送信（BulkMailSender）使用前提条件**: Drive自動添付を使う場合は `BULK_MAIL_AUTO_ATTACH_FOLDER_ID`（DriveフォルダID）を登録すること。
- データ移行期バリデーション緩和は全主要編集フォーム（StaffDetailAdmin / MemberForm / MemberDetailAdmin）に適用完了。
- GAS キャッシュ（TTL 600 秒）が切れるまで旧データが表示される場合がある。
- AI 案内メール機能（「AI案内メール作成」ボタン）は GEMINI_API_KEY が Script Properties に設定されていないと動作しない。
- **残課題**: `docs/58_NEXT_TASK_PERFORMANCE_2026-04-09.md` の B-02（`fetchAllDataFromDbFresh_` 最適化）は未着手。

## 6. 再開時チェック
```bash
git status --short
npx clasp show-authorized-user
npx clasp run healthCheck
npx clasp run getDbInfo
npx clasp deployments --json
```

期待値:
- authorized user が運用アカウント（k.noguchi@uguisunosato.or.jp）
- health check が成功
- fixed deployment 2 本が `@208`
- `getDbInfo` が本番固定 DB `1GVlIzOG1Tsqw8fBXgZ__c8u4oMu-4_WCf0H3aVLESKs` を返す

2026-04-15 確認結果（v208）:
- `npx clasp push --force` → 4 files pushed
- `npx clasp version "v208..."` → version 208 created
- `npx clasp deployments --json` → member/public ともに `versionNumber: 208`

## 7. 次担当者の最初の一手
1. `docs/44_DEVELOPMENT_HANDOVER_PLAYBOOK_2026-04-04.md` の「作業開始チェック」を実施する。
2. 本番管理者が未承認の場合、`/exec` にアクセスして gmail.send + drive の同意画面を承認する。
3. 名簿出力コンソールを使う場合は、システム設定でテンプレートSSのIDを登録する。
4. 宛名リスト出力コンソールはシステム設定不要。サイドバーから直接アクセス可能。
5. 残課題 B-02（パフォーマンス）に着手する場合は `docs/58_NEXT_TASK_PERFORMANCE_2026-04-09.md` を参照する。
6. 変更後は `HANDOVER.md` と関連正本を同ターンで更新する。

## 8. 引継ぎ体制メモ
- 入口は `HANDOVER.md`、日次運用は `docs/44_DEVELOPMENT_HANDOVER_PLAYBOOK_2026-04-04.md`、固定記録は `HANDOVER.md` に記載された最新の release state 文書を参照する。
- グランドルール入口は `AGENTS.md` のみ。`CLAUDE.md` は `AGENTS.md` へつなぐ互換入口としてのみ保持する。
- 新規 task は現行テンプレート `docs/31_HANDOVER_TASK_TEMPLATE.md` を複製して起票する。
- push や deploy 前は `git diff` でスコープを確認してからファイル単位でステージングすること。
## 2026-04-15 GCP / CLI migration note
- Current operational Google account for CLI and Cloud is `k.noguchi@hcm-n.org`.
- Current linked standard GCP project is `hcmn-member-system-prod`.
- Current linked GCP project number is `88737175415`.
- Apps Script project settings were switched from old project number `995586177540` to `88737175415` on 2026-04-15.
- `gcloud auth list` active account, `gcloud config get-value project`, `npx clasp show-authorized-user`, `npx clasp run healthCheck`, and `npx clasp run getDbInfo` were reverified on 2026-04-15 under `k.noguchi@hcm-n.org`.
- Required enabled APIs on the new GCP project for current operation: `script.googleapis.com`, `gmail.googleapis.com`.
- `.clasp.json` now points to `projectId: hcmn-member-system-prod`.
- `clasp run` recovery required a project-owned OAuth client. Local credential file used for recovery: `.tmp/oauth-client-hcmn-member-system-prod.json` with `npx clasp login --creds .tmp/oauth-client-hcmn-member-system-prod.json --use-project-scopes`.
- Fixed deployments were redeployed on 2026-04-15 by `k.noguchi@hcm-n.org` without changing version:
  - member `AKfycbywpWoYxij6A-ZunIeBjG1Q8qX78PMMTsT3frx1cM5PJ2nAuZpz81KruXb5LIvWgbQx` => `@208`
  - public `AKfycbxyuUXgK1oHUDMahQjluiL-gcrMK0qV0FWLFYaYBqGxlRSg9NhvmbyQRyf0dvaqg7Zp` => `@208`
- Before `clasp redeploy` under the new domain account, user-level Apps Script setting `Google Apps Script API` had to be enabled at `https://script.google.com/home/usersettings`.
