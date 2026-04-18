# 開発引継ぎ

更新日: 2026-04-18
現行本番: `v238`（GAS version 238）
固定 deployment: member `@238` / public `@238`
補足: v238 で会員種別変換に再活性化パターン導入（往復変換によるレコード蓄積を根絶）。v237 で転籍ドロップダウン検索フィルタ追加・CM番号重複修復API追加。v236 で個人→事業所転換機能強化。

## 0. v238 本番稼働中

### v238 — 会員種別変換に再活性化パターン導入（2026-04-18 リリース済み）
- **設計変更**: STAFF→INDIVIDUAL 変換で「同一CM番号の既存 WITHDRAWN 行を再活性化」に変更。新規 appendRow は初回のみ。
- **設計変更**: INDIVIDUAL→STAFF 変換で「同一CM番号 × 同一事業所の既存 LEFT 行を再活性化」に変更。新規 appendRowsByHeaders は初回のみ。
- **効果**: 何度往復しても T_会員・T_事業所職員 の行が増えない。入会日は再活性化日（today）で更新。
- **年会費継承**: T_年会費納入履歴 は memberId を参照するため、memberId 再利用により支払い済み履歴が自動継承される（コード変更不要）。
- **事前チェック追加**: STAFF→INDIVIDUAL 変換に step 2.5 を追加（他事業所に同CM番号の ENROLLED 職員がいる場合はエラー）。INDIVIDUAL→STAFF の pre-check と対称化。
- **post-check 廃止**: `assertSingleActiveAffiliationByCareManager_`（変換後アサート）を STAFF→INDIVIDUAL からも削除。事前チェックに一本化。
- Verification:
  - `npm run build:gas` ✅
  - `npx clasp push --force` ✅（4 files pushed）
  - `npx clasp version` ✅（version 238 created）
  - `npx clasp deployments --json` ✅（member + public ともに versionNumber: 238）
  - 実ブラウザ確認 → 操作者側で実施すること

---

### v237 — 転籍ドロップダウン検索フィルタ追加・会員CM番号重複修復（2026-04-18 リリース済み）
- **UX改善**: 「既存個人会員を転籍モーダル」のドロップダウンに検索テキスト入力欄を追加。名前・会員番号でリアルタイムフィルタリング可能に（150件超の会員一覧から選択できない問題を解消）。
- **バグ修正**: `convertIndividualToStaff_` の整合性チェックを変換後から変換前に移動（step 3.6）。ソース会員・全事業所を対象とした包括的な事前チェックにより、変換失敗後の中途半端な DB 状態を根絶。
- **新API**: `repairMemberCareManagerDuplicates_()` を MASTER 専用 API として公開。T_会員 で同一介護支援専門員番号を持つ複数 ACTIVE な個人/賛助会員を、入会日が最も新しい1件を残して WITHDRAWN に更新。
- **UI**: データ管理コンソールに「会員CM番号重複修復」セクションを追加（amber カード）。修復件数と対象会員ID・CM番号の詳細一覧を表示。
- Verification:
  - `npm run build:gas` ✅
  - `npx clasp push --force` ✅（4 files pushed）
  - `npx clasp version` ✅（version 237 created）
  - `npx clasp deployments --json` ✅（member + public ともに versionNumber: 237）
  - 実ブラウザ確認 → 操作者側で実施すること

---

### v236 — 個人→事業所転換強化・職員追加 CM 番号必須化（2026-04-18 リリース済み）
- **新機能**: 事業所会員詳細画面に「既存会員を転籍」ボタン追加。登録済みの個人/賛助会員を一覧から選択して転籍可能に。
- **バグ修正**: 職員追加フォームに`介護支援専門員番号`フィールド追加（必須・8桁・フロントバリデーション）。保存時バックエンドエラーになっていた問題を解消。
- **バグ修正**: `syncBusinessStaffRows_` が `介護支援専門員番号` を `upsertStaffRow_` に渡していなかった問題を修正（DB に空値で登録されていた）。
- **賛助会員転籍対応**: 個人→事業所転籍モーダル・既存会員転籍モーダル両方で、賛助会員が選択された場合に `介護支援専門員番号` 入力欄を表示。バックエンドで受け取り・DB 書き戻しも対応。
- **型拡張**: `ConvertMemberTypePayload` に `careManagerNumber?: string` を追加。
- Verification:
  - `npm run typecheck` ✅
  - `npm run build:gas` ✅
  - `npx clasp push --force` ✅（4 files pushed）
  - `npx clasp version` ✅（version 236 created）
  - `npx clasp deployments --json` ✅（member + public ともに versionNumber: 236）
  - 実ブラウザ確認 → 操作者側で実施すること

---

## 0b. v235 Current Quick Status
- current production: `v235` / fixed deployments member `@235` / public `@235`
- release-state の参照は当面 `docs/98_RELEASE_STATE_v235_2026-04-18.md` を正本とする。`v232`〜`v235` は個別文書へ未分割のため、再開時はまずこの 1 本を読むこと。
- 再開直後に `HANDOVER.md` と runtime の値が食い違う場合は、`npx clasp deployments --json` / `npx clasp run healthCheck` / `npx clasp run getDbInfo` の実行結果を優先し、その場で `HANDOVER.md` を更新する。
- **v235 セッションアンカー修正（ロール変換後のマイページ表示不整合）**:
  - 根本原因: フロントエンドが `memberId`（ロール変換のたびに変わる）をセッション識別子として使用していた。変換後に古い memberId でポータルデータを取得し、WITHDRAWN の個人会員画面が表示されていた。
  - OWASP原則「認証は安定した人物識別子で解決する」に従い、`loginId`（変換しても不変）をセッションアンカーに変更。
  - **バックエンド** `getMemberPortalData_`: `loginId` を受け取り、T_認証アカウントから現在の `memberId`/`staffId` を解決してポータルデータを返す。レスポンスに `resolvedMemberId`/`resolvedStaffId` を含める。後方互換: `memberId` 直接指定も引き続き動作。
  - **フロントエンド** `authenticatedContext`: `loginId` フィールドを追加して保存。
  - **フロントエンド** `loadMemberPortalData`: `loginId` を使って呼び出し、バックエンドが返した `resolvedMemberId`/`resolvedStaffId` でコンテキストと `selectedIdentityId` を自動補正。ロール変換後にページ遷移するだけで正しい種別のマイページが表示される。
- **v234 研修申込 申込者ID不整合修正**:
  - `migrateTrainingApplications_`: `会員ID`・`職員ID` の更新に加え `申込者ID = newMemberId` も同期するよう修正。会員種別変換後に研修申込が `isTrainingApplicationRowValid_` で不整合扱いされ全件除外されるバグを解消。
  - `repairTrainingApplicationApplicantIds_()`: 既存の不整合レコード（`申込者ID ≠ 会員ID`）を一括修復する新関数。`会員ID` が T_会員 に存在しない場合はスキップ（安全）。データ管理コンソールから実行可能（MASTER専用）。
  - 削除フラグ=true のレコードは絶対に変更しない実装。
- **v233 事業所職員重複バグ修正**: 個人会員⇔事業所会員を複数回往復すると T_事業所職員 に ENROLLED 重複レコードが生じるバグを修正。
  - `convertIndividualToStaff_`: 同一介護支援専門員番号 × 同一事業所の既存 ENROLLED 職員がいる場合に早期エラーを投げる冪等性ガードを追加（Step 3.5）。
  - `assertSingleActiveAffiliationByCareManager_`: staff+staff 重複も検出するチェックを追加（staffRows.length > 1）。
  - `convertStaffToIndividual_`: `today`/`now` の宣言をステップ3（代表者チェック）より前に移動（JS hoisting による undefined 参照バグを修正）。
  - `repairDuplicateStaffRecords_()`: 既存の重複 ENROLLED レコードを一括修復する新関数。GAS API + データ管理コンソール UI から実行可能（MASTER専用）。
- **v232 データ管理コンソール（物理削除）**: 継続有効。
- T_削除ログ: 初回は `npx clasp run addDeleteLogSheet` でシート作成が必要。
- postal code input is now standardized as split 3-digit + 4-digit UI while preserving `123-4567` storage.
- public membership application shows office destination name as a read-only reference block, not as an editable textbox.
- member-page annual fee history now prioritizes current / previous fiscal year and supplements missing eligible years as `UNPAID`.

## 1. 最初に読むもの
1. `HANDOVER.md`
2. `AGENTS.md`
3. `GLOBAL_GROUND_RULES/docs/AI_RULES/05_PROJECT_RULES_HIRAKATA.md`
4. `docs/44_DEVELOPMENT_HANDOVER_PLAYBOOK_2026-04-04.md`
5. `docs/98_RELEASE_STATE_v235_2026-04-18.md` ← **v235 current**（セッションアンカー loginId 化・ロール変換後マイページ修正）
6. `docs/98_RELEASE_STATE_v235_2026-04-18.md` 内の `v234` 節（研修申込 申込者ID不整合修正）
7. `docs/98_RELEASE_STATE_v235_2026-04-18.md` 内の `v233` 節（事業所職員重複バグ修正 + repairDuplicateStaffRecords）
8. `docs/98_RELEASE_STATE_v235_2026-04-18.md` 内の `v232` 節（MASTER専用物理削除機能）
9. `docs/94_RELEASE_STATE_v231_2026-04-17.md`（v231 record: 郵便番号入力標準化 + 参照専用表示 + 年会費連続年度表示）
10. `docs/93_RELEASE_STATE_v230_2026-04-17.md`（v230 record: current principal 解決 + 再遷移整合修正）
11. `docs/92_RELEASE_STATE_v229_2026-04-17.md`（v229 record: 会員マイページ 年会費表示修正）
12. `docs/91_RELEASE_STATE_v228_2026-04-17.md`（v228 record: 公開入会申込 完了画面制御 + 住所入力改善）
13. `docs/90_RELEASE_STATE_v227_2026-04-17.md`（v227 record: 公開ポータル文言設定対応）
14. `docs/89_RELEASE_STATE_v226_2026-04-17.md`（v226 record: 入会申込フォーム 住所・連絡情報ステップ統合）
15. `docs/88_RELEASE_STATE_v225_2026-04-17.md`（v225 record: 公開入会申込遷移ルール + 重要事項ダイアログ + 一括メールテンプレート保存）
16. `docs/87_RELEASE_STATE_v224_2026-04-16.md`（v224 record: 一括メール送信テンプレート保存 + Drive 自動添付既定 OFF）
17. `docs/86_RELEASE_STATE_v223_2026-04-16.md`（v223 record: 公開ポータル入会前案内ダイアログ + 定款リンク）
18. `docs/85_RELEASE_STATE_v222_2026-04-16.md`（v222 record: 公開ポータル入会前案内追加）
19. `docs/84_RELEASE_STATE_v221_2026-04-16.md`（v221 record: 年度集計バグ修正 + セイ・メイ変換）
20. `docs/83_RELEASE_STATE_v216_2026-04-16.md`（v216 record: 個人会員編集バリデーション見直し）
21. `docs/80_RELEASE_STATE_v209_2026-04-16.md`（v209 record: 入会時認証情報メール送信制御）
22. `docs/79_HANDOVER_2026-04-15.md` ← 引継ぎ資料（v208 時点）— 機能一覧・運用・落とし穴まとめ
23. `docs/78_RELEASE_STATE_v208_2026-04-15.md`（v208 record）
24. `docs/77_RELEASE_STATE_v207_2026-04-15.md`（v207 record）
25. `docs/76_RELEASE_STATE_v206_2026-04-15.md`（v206 record）
26. `docs/75_RELEASE_STATE_v205_2026-04-14.md`（v205 record）
27. `docs/63_SOW_ROSTER_PDF_AND_BULK_MAIL_2026-04-10.md` ← **全フェーズ完了（Phase 1〜3）**
28. `docs/58_NEXT_TASK_PERFORMANCE_2026-04-09.md`（B-02 未着手・残課題）
29. `docs/09_DEPLOYMENT_POLICY.md`
30. `docs/05_AUTH_AND_ROLE_SPEC.md`
31. `docs/04_DB_OPERATION_RUNBOOK.md`
32. `docs/03_DATA_MODEL.md`
- v197〜v204 記録: `docs/archive/release_history/`（67〜74）
- v170〜v196 記録: `docs/archive/release_history/`（45〜66）

## 2. 現在の引継ぎ結論
- 開発の入口は `HANDOVER.md`、運用手順の正本は `docs/44_DEVELOPMENT_HANDOVER_PLAYBOOK_2026-04-04.md`。
- 本番状態の判断は `HANDOVER.md`、作業の進め方と完了条件は `docs/44_DEVELOPMENT_HANDOVER_PLAYBOOK_2026-04-04.md` に記録する。
- 最新の release state 文書は `HANDOVER.md` の「最初に読むもの」に記載されたものを参照する。
- task 単位の個票は `docs/31_HANDOVER_TASK_TEMPLATE.md` を複製して管理する。
- 2026-04-10 の引継ぎ確認ログは `docs/archive/historical/65_HANDOVER_TASK_DEV_SETUP_2026-04-10.md` を参照する。

## 3. 現在の本番状態
- ブランチ運用の基準は `main`。
- 両 fixed deployment は `@235` を向いている（GAS version 235）。差異が出た場合はセクション 6 の runtime 確認結果を優先する。
- fixed deployment の標準同期方法は `npx clasp redeploy`。Apps Script UI `Manage deployments` は障害復旧時の補助手段に限定する。
- member portal は sidebar logout を採用済み。
- デモログイン、mock member route、画面内 demo selector は廃止済み。
- business member は `REPRESENTATIVE` 行を代表者情報の正本とする。
- 個人会員 / 居宅介護支援事業者所属でない会員は、`officeName` が空または `????` の場合に所属なしとして正規化する。
- デモアカウント（本番 DB）: `demo-ind-001` / `demo1234`（個人会員）、`demo-ind-002` / `demo1234`（個人会員）。
- 管理者ログイン: `checkAdminBySession`（auth のみ）。会員データは遷移後の遅延取得。
- フロントエンド HTML 圧縮: deflate-raw + base64（`scripts/compress-html.mjs`）。member ~230 kB / public ~155 kB。
- **公開ポータル文言設定**: `T_システム設定` の `PUBLIC_PORTAL_*` キーで、トップ補助ラベル・トップ見出し・トップ説明文・入会カードの補助ラベル/見出し/説明文/CTA を管理。管理者画面から表示ON/OFFと文言変更が可能。
- **設定保存**: `getSystemSettingMap_` + `batchUpsertSystemSettings_` による 1 パス処理（旧 N+1 解消済み）。
- **セイ・メイ入力**: 入力中は全文字許可。保存時に全角カナ・ひらがな → 半角カナへ自動変換（v220〜）。
- **年度集計**: ダッシュボードのカード数値はフロントエンドが `memberRows` から再計算（バックエンドの `individualCount` 等は UI 未使用）。

## 4. 直近の重要履歴

### v229（2026-04-17）— 詳細: `docs/92_RELEASE_STATE_v229_2026-04-17.md`

#### v229（GAS 229）— 会員マイページ 年会費表示修正
- 当年度未納補完が入る場合でも、会員マイページの年会費履歴で前年・前々年が落ちないよう最大3件まで返すよう修正。
- これにより、2026年度未納補完時でも 2025 年度の履歴が欠落しない。
- 未納時の納入ダイアログでは、個別レコード側の口座情報が不完全な場合でも `ANNUAL_FEE_TRANSFER_ACCOUNT` の共通振込先へ確実にフォールバックする。

### v228（2026-04-17）— 詳細: `docs/91_RELEASE_STATE_v228_2026-04-17.md`

#### v228（GAS 228）— 公開入会申込 完了画面制御 + 住所入力改善
- 完了画面のログイン情報表示を `PUBLIC_PORTAL_COMPLETION_LOGIN_INFO_VISIBLE` で ON/OFF 切替可能にした。
- ログイン情報非表示時は、メール確認または会員ページ公開待ちの案内文を表示する。
- 完了画面に「年会費や振込先などのご案内は、登録メールアドレスをご確認ください。」を追加。
- 個人/賛助会員の住所入力で、勤務先を郵送先にした場合のみ `officeName` を必須化。
- 非選択側住所の郵便番号が空でも形式エラーにならないよう初期値とバリデーションを修正。
- `勤務先・所属情報` と `勤務先住所` を分離し、勤務先郵送時は事業所名を送付先名として明示表示する。

### v227（2026-04-17）— 詳細: `docs/90_RELEASE_STATE_v227_2026-04-17.md`

#### v227（GAS 227）— 公開ポータル文言設定対応
- 公開ポータルの `APPLICATION PORTAL` を既定で非表示化。
- 入会カードの `MEMBERSHIP` を既定で `入会申込` に変更。
- `ログイン不要で申込できます` を削除し、CTA を `入会申込へ進む` に変更。
- 管理画面のシステム設定から、トップ案内文と入会カード文言を表示ON/OFF込みで変更可能にした。
- `T_システム設定` に `PUBLIC_PORTAL_*` の文言設定キーを追加。

### v226（2026-04-17）— 詳細: `docs/89_RELEASE_STATE_v226_2026-04-17.md`

#### v226（GAS 226）— 入会申込フォーム 住所・連絡情報ステップ統合
- 個人/賛助会員の Step 3「連絡設定」を廃止し、Step 2「住所・連絡情報」に統合（4ステップ構成へ）。
- 郵送先を先頭のラジオカードで選択 → 選択側の住所フィールドを必須、非選択側は任意。
- 勤務先の事業所名を住所必須から切り離し、独立した任意入力欄へ。
- 電話番号 OR 携帯電話番号のどちらか一方入力でOK（複合バリデーション）。
- メールアドレスを目立つ青グラデーションカードで住所ステップ内に統合。
- 発送方法もラジオカード形式に統一。
- WCAG 2.2 準拠: `role="radiogroup"`, `aria-required`, `aria-invalid`, `role="alert"` 追加。
- フロントエンドのみの変更。Code.gs・DB スキーマ変更なし。

### v225（2026-04-17）— 詳細: `docs/88_RELEASE_STATE_v225_2026-04-17.md`

#### v225（GAS 225）— 公開入会申込の会員種別遷移ルール + 重要事項ダイアログ + 一括メールテンプレート保存
- 公開 `submitMemberApplication_` に `介護支援専門員番号` / `事業所番号` ベースの遷移ルール追加。
- 公開ポータルの入会前案内をダイアログ方式へ変更（定款リンク含む）。
- 一括メール送信コンソールにテンプレート保存・読込・削除 UI を追加。

### v224（2026-04-16）— 詳細: `docs/87_RELEASE_STATE_v224_2026-04-16.md`

#### v224（GAS 224）— 一括メール送信テンプレート保存 + Drive 自動添付既定 OFF
- 一括メール送信コンソールに、件名・本文の保存、読込、削除ができるテンプレート UI を追加。
- バックエンドに `BULK_MAIL_TEMPLATES` を用いた保存 API を追加し、管理権限経由で運用可能に統一。
- Drive フォルダからの個別自動添付は既定で OFF に変更し、送信時に必要な場合のみ明示的に ON にする導線へ変更。

### v223（2026-04-16）— 詳細: `docs/86_RELEASE_STATE_v223_2026-04-16.md`

#### v223（GAS 223）— 公開ポータル入会前案内ダイアログ + 定款リンク
- 常設の重要事項表示をダイアログ方式へ変更
- 変更・退会の手続き導線は該当カード内に配置
- 定款リンクをダイアログ内に追加
- ダイアログ確認後に `確認済み` 状態を表示し、未確認時は会員種別選択を不可のまま維持

### v222（2026-04-16）— 詳細: `docs/85_RELEASE_STATE_v222_2026-04-16.md`

#### v222（GAS 222）— 公開ポータル入会前案内追加
- 新規入会申込フォームの先頭に「事務局からのお願い（ご入会にあたって）」セクションを追加
- 会費返還不可、個人情報利用目的、登録情報変更/退会手続き、年度切替前の退会期限を要点整理 + 全文掲示
- 確認チェックを入れるまで会員種別選択を不可に変更
- 協議会ホームページ導線は Google Sites 直リンクへ統一

### v220–v221（2026-04-16）— 詳細: `docs/84_RELEASE_STATE_v221_2026-04-16.md`

#### v221（GAS 221）— 年度集計 joinedDate 空会員の除外バグ修正
- `getMemberStatusAtFiscalYear` / `getStaffStatusAtFiscalYear`（App.tsx）で `joinedDate` が空の会員が
  全年度から除外されていた（`if (!joined) return null`）→ 在籍扱いに修正
- これが「管理コンソール個人会員(152) ≠ 宛名リスト個人会員(161)」の主因（差 = joinedDate 未設定会員）
- バックエンド（Code.gs）: v220 の日付パースバグ修正
  - `new Date(rawDate + 'T00:00:00')` → `normalizeDateInput_()` + `new Date(norm + 'T00:00:00+09:00')`

#### v220（GAS 220）— セイ・メイ自動変換 + 年度内在籍判定修正
- **セイ・メイ**: 入力中は全文字許可。保存時に全角カナ・ひらがな → 半角カナへ自動変換
  - `toHalfWidthKana()` 関数追加（MemberDetailAdmin.tsx / MemberForm.tsx）
  - `validateAllRequired()` / `validate()` に `overrideForm` パラメータ追加（変換後の値で検証）
- **年度内在籍**: `getAdminDashboardData_` の在籍判定を `isActive` → `isInFiscalYear` ロジックに変更
  - 退会日が年度末以前なら在籍扱いに（例: 退会 2026-03-31 → 2025年度は在籍）

### v219（2026-04-16）— GAS version 219
- 入会メール マージタグ追加: `{{会員種別}}`（M_会員種別から動的解決）/ `{{年会費}}`（`3,000円` 形式）
- マージタグをクリックで本文末尾に挿入できるインライン UI
- テンプレート保存・読み込み・削除機能（T_システム設定 `CREDENTIAL_EMAIL_TEMPLATES` キーに JSON）
- Backend: `getCredentialEmailTemplates` / `saveCredentialEmailTemplate` / `deleteCredentialEmailTemplate`

### v218（2026-04-16）— GAS version 218
- favicon PNG data URI テスト → GAS は data URI を全形式拒否と確認
- `setFaviconUrl()` は HTTPS 外部 URL のみ対応。Drive 公開共有は組織ポリシーでブロック
- favicon は断念。`setTitle()` によるタブタイトルのみ有効（v217 から継続）
- `setupFavicons` 関数はコード内に残留（将来の GCS 対応用）

### v217（2026-04-16）— GAS version 217
- ブラウザタブ title カスタマイズ（favicon は断念）
- `doGet()` に `setTitle()` を追加
- 会員マイページ: タイトル `会員マイページ｜枚方市ケアマネ協議会`
- 公開ポータル: タイトル `研修・入会申込ポータル｜枚方市ケアマネ協議会`

### v210〜v216（2026-04-16）
詳細は `docs/81_RELEASE_STATE_v210-v214_2026-04-16.md`、`docs/83_RELEASE_STATE_v216_2026-04-16.md`。

#### v216 — 個人会員バリデーション全面見直し
#### v215 — 管理コンソール 事業所会員 スタッフ追加 + 保存ゲート
#### v214 — 公開ポータル FOIC 修正・Skeleton UI
#### v213 — 設定保存ボタン変更検知（dirty state）
#### v212 — 設定保存 N+1 問題解消（~14秒 → ~2秒）
#### v211 — build:gas 適用漏れ修正
#### v210 — 公開ポータル メニュー表示設定

### v209（2026-04-16）
- 入会時ログイン情報メール送信制御（`CREDENTIAL_EMAIL_ENABLED` T_システム設定 キー）

### v208（2026-04-15）
- 宛名リスト 2 バグ修正。GCP / CLI 移行（`k.noguchi@uguisunosato.or.jp` → `k.noguchi@hcm-n.org`）

### v207（2026-04-15）
- 宛名リスト Excel 出力コンソール（`MailingListExport.tsx`）追加

### v206（2026-04-15）
- T_会員 に住所 2 列（建物名）追加。`addAddressLine2Columns()` マイグレーション実行済み

### v205（2026-04-14）
- PDF 出力 1000 件対応アーキテクチャ刷新（chunked + all-or-nothing + retry）

### v203–v204（2026-04-10/14）
- Phase 3（PDF 名簿出力コンソール）完了。SOW 全フェーズ完了

---
v195〜v202、v170〜v193 の詳細は `docs/79_HANDOVER_2026-04-15.md` または `docs/archive/release_history/` を参照。

## 5. 現時点の注意事項（2026-04-18 更新）

- **fixed deployment 2 本は `@235`** を向いている想定（GAS version 235）。再開時は必ず `npx clasp deployments --json` で実測確認する。
- **v206 DB 適用済み**: `npx clasp run addAddressLine2Columns` は実行完了。本番 `T_会員` に `勤務先住所2` / `自宅住所2` 列が追加されている。
- **v194 リリース済みのため、本番管理者（`k.noguchi@hcm-n.org`）は次回 `/exec` アクセス時に `gmail.send + drive` の同意画面が表示される場合がある。** 未承認の場合は必ず承認すること。
- **名簿出力コンソール（RosterExport）使用前提条件**: システム設定画面で `ROSTER_TEMPLATE_SS_ID`（テンプレートスプレッドシート ID）を登録すること。
- **一括メール送信（BulkMailSender）使用前提条件**: Drive 自動添付を使う場合は `BULK_MAIL_AUTO_ATTACH_FOLDER_ID`（Drive フォルダ ID）を登録すること。
- **公開ポータル メニュー設定反映手順**: 管理設定 → 公開ポータル メニュー表示設定 → 変更 → 「設定を保存」→ 公開ポータルをリロード。
- データ移行期バリデーション緩和は全主要編集フォーム（StaffDetailAdmin / MemberForm / MemberDetailAdmin）に適用完了。
- GAS キャッシュ（TTL 600 秒）が切れるまで旧データが表示される場合がある。
- AI 案内メール機能（「AI 案内メール作成」ボタン）は `GEMINI_API_KEY` が Script Properties に設定されていないと動作しない。
- **joinedDate 未設定会員**: 現在 9 名程度（暫定）。v221 修正で在籍扱いになり数値は正常化したが、
  データとして `joinedDate` を補完する作業が望ましい（管理コンソールから直接編集可能）。
- **残課題**: `docs/58_NEXT_TASK_PERFORMANCE_2026-04-09.md` の B-02（`fetchAllDataFromDbFresh_` 最適化）は未着手。
- **次フェーズ候補**: 本番 DB に残っているデモデータを削除できる機能と、テスト/デバッグ用の限定的な DB 操作機能を追加したい要望がある。
  - ただし DB 全削除・全件更新・全件置換に該当し得るため、`GLOBAL_GROUND_RULES/docs/AI_RULES/20_SECURITY_APPROVALS.md` の特別ルールを厳守すること。
  - 少なくとも `dry-run / 対象件数プレビュー / テーブル単位指定 / 実行前バックアップ確認 / 明示承認 / 実行ログ記録` を必須にする。
  - `seedDemoData` と同等以上に危険な操作として扱い、管理者向けでも通常 UI には常設せず、権限・停止点・復旧手順を先に正本化すること。

## 6. 再開時チェック
```bash
git status --short
npx clasp show-authorized-user
npx clasp deployments --json
npx clasp run healthCheck
npx clasp run getDbInfo
```

期待値:
- authorized user が運用アカウント（`k.noguchi@hcm-n.org`）
- fixed deployment 2 本が `@235`（versionNumber: 235）
- healthCheck が `ok: true` を返す
- `getDbInfo` が本番固定 DB `1GVlIzOG1Tsqw8fBXgZ__c8u4oMu-4_WCf0H3aVLESKs` を返す

**⚠️ `clasp run` が失敗する場合**: 再ログイン後にproject-scoped OAuth が必要。
```bash
npx clasp login --creds .tmp/oauth-client-hcmn-member-system-prod.json --use-project-scopes --no-localhost
```
ブラウザで認証後、リダイレクト URL の `code=` の値をターミナルにペーストする。

2026-04-18 確認結果（v236 リリース後）:
- `npx clasp deployments --json` → member + public ともに `versionNumber: 236` ✅
- 実ブラウザ確認 → 操作者側で実施すること

2026-04-18 確認結果（v235 セッション開始時 実測）:
- `git status --short` → `M HANDOVER.md`, `?? docs/MCP_SETUP_MANUAL.html`
- `npx clasp show-authorized-user` → `k.noguchi@hcm-n.org` ✅
- `npx clasp deployments --json` → member + public ともに `versionNumber: 235` ✅
- `npx clasp run healthCheck` → `ok: true` ✅
- `npx clasp run getDbInfo` → 本番固定 DB `1GVlIzOG1Tsqw8fBXgZ__c8u4oMu-4_WCf0H3aVLESKs` ✅
- `T_削除ログ` シート → getDbInfo のシート一覧に存在（addDeleteLogSheet 実施済み）✅
- 実ブラウザ確認 → 操作者側で実施すること

2026-04-17 確認結果（v231）:
- `npm run typecheck` → pass
- `npm run build` → pass
- `npm run build:gas` → pass
- `npx clasp push --force` → success
- `npx clasp version` → version 231 created
- `npx clasp show-authorized-user` → `k.noguchi@hcm-n.org` ✅
- `npx clasp deployments --json` → member + public ともに `versionNumber: 231` ✅
- `npx clasp run healthCheck` → ❌ `Unable to run script function`（project-scoped OAuth 再設定が必要な既知問題）
- `npx clasp run getDbInfo` → ❌ `Unable to run script function`（同上）

## 7. 次担当者（Codex）の最初の一手

1. `docs/44_DEVELOPMENT_HANDOVER_PLAYBOOK_2026-04-04.md` の「作業開始チェック」を実施する。
2. 再開時チェック（セクション 6）を実行し、deployment が `@235` を向いているか実測確認する。
3. **`clasp run` が "Unable to run script function" で失敗する場合**:
   - `npx clasp login --creds .tmp/oauth-client-hcmn-member-system-prod.json --use-project-scopes --no-localhost` を実行
   - ブラウザ認証 → リダイレクト URL の `code=` 値をターミナルにペースト
   - `npx clasp run healthCheck` を再試行
4. **公開ポータルの入会申込フォームを実ブラウザで確認する**（v226 フロントエンド変更）:
   - Step 2「住所・連絡情報」で郵送先ラジオカードが表示されることを確認
   - 「勤務先」選択時: 勤務先住所が必須（青枠）、自宅が任意になることを確認
   - 「自宅」選択時: 自宅住所が必須（青枠）、勤務先が任意になることを確認
   - 事業所名が任意入力であること（* マークなし）を確認
   - 電話番号・携帯電話番号の「どちらか一方必須」バッジを確認
   - メールアドレスが青いカード内に表示されることを確認
   - 発送方法がラジオカードで選択できることを確認
5. 残課題 B-02（パフォーマンス）に着手する場合は `docs/58_NEXT_TASK_PERFORMANCE_2026-04-09.md` を参照する。
6. **変更後は必ず `HANDOVER.md` と関連正本を同ターンで更新する。**
7. 次フェーズで「デモデータ削除 / DB デバッグ機能」に着手する場合は、実装前に task 個票を切り、承認境界・対象テーブル・バックアップ前提・ロールバック方法を先に整理する。

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

## 2026-04-16 deployment note (v216)
- Production release `v216` is now deployed.
- Fixed deployments were synced as member `@216` / public `@216`.
- Personal-member validation rules were revised in both member portal and admin console.
- Latest release-state reference: `docs/83_RELEASE_STATE_v216_2026-04-16.md`

## 2026-04-16 deployment note (v217–v219)
- v217: ブラウザタブ title カスタマイズ（favicon は GAS 制約で断念）
- v218: favicon PNG data URI テスト → GAS は全形式の data URI を拒否（`setFaviconUrl()` は外部 HTTPS URL のみ）
- v219: 入会メール マージタグ（`{{会員種別}}` / `{{年会費}}`）+ テンプレート保存/読み込み機能
- Latest release-state reference: `docs/83_RELEASE_STATE_v216_2026-04-16.md`（v216 記録）

## 2026-04-16 deployment note (v220–v221)
- v220 (GAS 220): セイ・メイ自動変換 + 年度内在籍判定修正
- v221 (GAS 221): 年度集計 joinedDate 空会員バグ修正（フロントエンド主因 + バックエンド日付パース修正）
- Both fixed deployments redeployed to GAS version 221 on 2026-04-16.
- `npx clasp deployments --json` confirmed: member + public both at `versionNumber: 221`.
- Latest release-state reference: `docs/84_RELEASE_STATE_v221_2026-04-16.md`

## 2026-04-16 deployment note (v222)
- v222 (GAS 222): 公開ポータルの新規入会申込フォーム先頭に「事務局からのお願い」を追加
- 重要事項の確認チェックを入れるまで会員種別選択を不可に変更
- 協議会ホームページ導線は Google Sites 直リンクへ変更
- Both fixed deployments redeployed to GAS version 222 on 2026-04-16.
- `npx clasp deployments --json` confirmed: member + public both at `versionNumber: 222`.
- Latest release-state reference: `docs/85_RELEASE_STATE_v222_2026-04-16.md`

## 2026-04-16 deployment note (v223)
- v223 (GAS 223): 公開ポータルの入会前案内をダイアログ方式へ変更
- 「変更・退会の手続き」カード内に協議会ホームページ導線を配置
- ダイアログ内に定款リンクを追加
- Both fixed deployments redeployed to GAS version 223 on 2026-04-16.
- `npx clasp deployments --json` confirmed: member + public both at `versionNumber: 223`.
- Latest release-state reference: `docs/86_RELEASE_STATE_v223_2026-04-16.md`

## 2026-04-16 deployment note (v224)
- v224 (GAS 224): 一括メール送信コンソールにテンプレート保存・読込・削除 UI を追加
- バックエンドに `BULK_MAIL_TEMPLATES` キーを用いたテンプレート保存 API を追加
- Drive フォルダからの個別自動添付は既定値を `OFF` に変更し、明示チェック時のみ有効
- Both fixed deployments redeployed to GAS version 224 on 2026-04-16.
- `npx clasp deployments --json` confirmed: member + public both at `versionNumber: 224`.
- Latest release-state reference: `docs/87_RELEASE_STATE_v224_2026-04-16.md`

## 2026-04-17 task note
- Public `submitMemberApplication_` now has released transition logic keyed by `介護支援専門員番号` and `事業所番号`.
- Implemented locally:
  - business staff -> individual member
  - individual/support member -> applied business staff
  - business staff -> another business office staff
  - duplicate individual registration rejection
  - duplicate business office registration rejection by `事業所番号`
- Representative transfer now auto-picks a successor when the source office still has enrolled staff, and withdraws the source office when no staff remain.
- Local verification completed:
  - `npm run typecheck`
  - `npm run build`
  - `npm run build:gas`
- Release verification completed on Apps Script execution path and fixed deployment sync.

## 2026-04-17 deployment note (v225)
- v225 (GAS 225): 公開入会申込の会員種別遷移ルール、重要事項ダイアログ、一括メールテンプレート保存を本番反映。
- member/public の両 fixed deployment を `npx clasp redeploy` で `@225` に同期。
- Verification passed:
  - `npm run typecheck`
  - `npm run build`
  - `npm run build:gas`
  - `npx clasp deployments --json`
  - `npx clasp run healthCheck`
  - `npx clasp run getDbInfo`
- Latest release-state reference: `docs/88_RELEASE_STATE_v225_2026-04-17.md`
- Detailed task handover: `docs/archive/historical/89_HANDOVER_TASK_v225_PUBLIC_MEMBERSHIP_TRANSITIONS_2026-04-17.md`

## 2026-04-17 deployment note (v226)
- v226 (GAS 226): 個人/賛助会員入会申込フォームの住所・連絡情報ステップを統合。フロントエンドのみの変更。
- 変更内容: 郵送先ラジオカード選択・事業所名任意化・電話番号OR必須・メールアドレスをStep2に統合・発送方法ラジオカード化。
- member/public の両 fixed deployment を `npx clasp redeploy` で `@226` に同期。
- Verification:
  - `npm run typecheck` ✅
  - `npm run build:gas` ✅
  - `npx clasp push --force` ✅ (4 files pushed)
  - `npx clasp deployments --json` ✅ (member + public both at versionNumber: 226)
  - `npx clasp run healthCheck` ❌ (project-scoped OAuth 再設定が必要 — 次セッション開始時に再試行すること)
- Latest release-state reference: `docs/89_RELEASE_STATE_v226_2026-04-17.md`

## 2026-04-17 deployment note (v227)
- v227 (GAS 227): 公開ポータルのトップ案内文・入会カード文言を設定画面から変更可能にし、英語ラベルの既定値と冗長文言を整理。
- 既定値: `APPLICATION PORTAL` 非表示、`MEMBERSHIP` → `入会申込`、入会カードCTA → `入会申込へ進む`。
- member/public の両 fixed deployment を `npx clasp redeploy` で `@227` に同期。
- Verification:
  - `npm run typecheck` ✅
  - `npm run build` ✅
  - `npm run build:gas` ✅
  - `npx clasp push --force` ✅
  - `npx clasp version` ✅ (version 227 created)
  - `npx clasp deployments --json` ✅ (member + public both at versionNumber: 227)
  - `npx clasp run healthCheck` ❌ (`Unable to run script function` — project-scoped OAuth 再設定が必要)
  - `npx clasp run getDbInfo` ❌ (`Unable to run script function` — 同上)
- Latest release-state reference: `docs/90_RELEASE_STATE_v227_2026-04-17.md`

## 2026-04-17 deployment note (v228)
- v228 (GAS 228): 公開入会申込の完了画面ログイン情報表示トグル、メール案内/振込案内メッセージ整理、勤務先郵送時の事業所名必須化、非選択住所の郵便番号バリデーション誤爆修正、勤務先・所属情報と郵送先住所のUI分離を本番反映。
- member/public の両 fixed deployment を `npx clasp redeploy` で `@228` に同期。
- Verification:
  - `npm run typecheck` ✅
  - `npm run build` ✅
  - `npm run build:gas` ✅
  - `npx clasp push --force` ✅
  - `npx clasp version` ✅ (version 228 created)
  - `npx clasp deployments --json` ✅ (member + public both at versionNumber: 228)
  - `npx clasp run healthCheck` ❌ (`Unable to run script function` — project-scoped OAuth / permission issue 継続)
  - `npx clasp run getDbInfo` ❌ (`Unable to run script function` — 同上)
- 実ブラウザ確認は既定どおり操作者側で実施する。AI / agent 側ではコード上の検証と Apps Script 実行系コマンド確認まで完了。
- Latest release-state reference: `docs/91_RELEASE_STATE_v228_2026-04-17.md`

## 2026-04-18 deployment note (v232)
- v232 (GAS 232): MASTER権限専用の物理削除機能を追加。
- 変更内容:
  - バックエンド: T_削除ログ テーブル定義追加 / searchMembersForDelete_ / previewDeleteMember_ / executeDeleteMember_ / getDeleteLogs_ / addDeleteLogSheet() 関数追加
  - フロントエンド: MemberDeleteConsole.tsx 新規作成 / Sidebar MASTER専用メニュー追加 / App.tsx view ルーティング追加
  - api.ts: MemberDeleteSearchResult / MemberDeletePreview / MemberDeleteResult / DeleteLogEntry 型追加 + API メソッド追加
- リリース手順（clasp 再認証後に実施）:
  1. `npx clasp push --force`
  2. `npx clasp version "v232 MASTER物理削除機能追加"`
  3. `npx clasp redeploy <member-deploy-id> --versionNumber 232`
  4. `npx clasp redeploy <public-deploy-id> --versionNumber 232`
  5. `npx clasp run addDeleteLogSheet`（T_削除ログ シート新設）
  6. `npx clasp deployments --json` で両 deployment が @232 であることを確認
- Verification（コード上）:
  - `npm run typecheck` ✅
  - `npm run build:gas` ✅
  - `npx clasp push --force` → 未実行（clasp 再認証待ち）
  - 実ブラウザ確認 → 操作者側で実施（MASTER権限でログイン → サイドバー「データ管理コンソール」表示確認）
- Latest release-state reference: `docs/98_RELEASE_STATE_v235_2026-04-18.md`
