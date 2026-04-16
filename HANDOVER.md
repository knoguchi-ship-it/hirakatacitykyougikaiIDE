# 開発引継ぎ

更新日: 2026-04-17
現行本番: `v226`（GAS version 226）
固定 deployment: member `@226` / public `@226`
補足: v226 で個人/賛助会員申込フォームの住所・連絡情報ステップを統合（郵送先ラジオ選択・事業所名任意・電話OR必須・メール統合）。
v225 以前の変更も継続有効。

## 1. 最初に読むもの
1. `HANDOVER.md`
2. `AGENTS.md`
3. `GLOBAL_GROUND_RULES/docs/AI_RULES/05_PROJECT_RULES_HIRAKATA.md`
4. `docs/44_DEVELOPMENT_HANDOVER_PLAYBOOK_2026-04-04.md`
5. `docs/89_RELEASE_STATE_v226_2026-04-17.md` ← **v226 current**（入会申込フォーム 住所・連絡情報ステップ統合）
6. `docs/88_RELEASE_STATE_v225_2026-04-17.md`（v225 record: 公開入会申込遷移ルール + 重要事項ダイアログ + 一括メールテンプレート保存）
7. `docs/87_RELEASE_STATE_v224_2026-04-16.md`（v224 record: 一括メール送信テンプレート保存 + Drive 自動添付既定 OFF）
7. `docs/86_RELEASE_STATE_v223_2026-04-16.md`（v223 record: 公開ポータル入会前案内ダイアログ + 定款リンク）
8. `docs/85_RELEASE_STATE_v222_2026-04-16.md`（v222 record: 公開ポータル入会前案内追加）
9. `docs/84_RELEASE_STATE_v221_2026-04-16.md`（v221 record: 年度集計バグ修正 + セイ・メイ変換）
10. `docs/83_RELEASE_STATE_v216_2026-04-16.md`（v216 record: 個人会員編集バリデーション見直し）
11. `docs/80_RELEASE_STATE_v209_2026-04-16.md`（v209 record: 入会時認証情報メール送信制御）
12. `docs/79_HANDOVER_2026-04-15.md` ← 引継ぎ資料（v208 時点）— 機能一覧・運用・落とし穴まとめ
13. `docs/78_RELEASE_STATE_v208_2026-04-15.md`（v208 record）
14. `docs/77_RELEASE_STATE_v207_2026-04-15.md`（v207 record）
15. `docs/76_RELEASE_STATE_v206_2026-04-15.md`（v206 record）
16. `docs/75_RELEASE_STATE_v205_2026-04-14.md`（v205 record）
17. `docs/63_SOW_ROSTER_PDF_AND_BULK_MAIL_2026-04-10.md` ← **全フェーズ完了（Phase 1〜3）**
18. `docs/58_NEXT_TASK_PERFORMANCE_2026-04-09.md`（B-02 未着手・残課題）
19. `docs/09_DEPLOYMENT_POLICY.md`
20. `docs/05_AUTH_AND_ROLE_SPEC.md`
21. `docs/04_DB_OPERATION_RUNBOOK.md`
22. `docs/03_DATA_MODEL.md`
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
- 両 fixed deployment は `@226` を向いている（GAS version 226）。
- fixed deployment の標準同期方法は `npx clasp redeploy`。Apps Script UI `Manage deployments` は障害復旧時の補助手段に限定する。
- member portal は sidebar logout を採用済み。
- デモログイン、mock member route、画面内 demo selector は廃止済み。
- business member は `REPRESENTATIVE` 行を代表者情報の正本とする。
- 個人会員 / 居宅介護支援事業者所属でない会員は、`officeName` が空または `????` の場合に所属なしとして正規化する。
- デモアカウント（本番 DB）: `demo-ind-001` / `demo1234`（個人会員）、`demo-ind-002` / `demo1234`（個人会員）。
- 管理者ログイン: `checkAdminBySession`（auth のみ）。会員データは遷移後の遅延取得。
- フロントエンド HTML 圧縮: deflate-raw + base64（`scripts/compress-html.mjs`）。member ~230 kB / public ~155 kB。
- **公開ポータル メニュー表示設定**: `T_システム設定` の `PUBLIC_PORTAL_TRAINING_MENU_ENABLED` / `PUBLIC_PORTAL_MEMBERSHIP_MENU_ENABLED` で管理。管理者が ON/OFF 切替可能。
- **設定保存**: `getSystemSettingMap_` + `batchUpsertSystemSettings_` による 1 パス処理（旧 N+1 解消済み）。
- **セイ・メイ入力**: 入力中は全文字許可。保存時に全角カナ・ひらがな → 半角カナへ自動変換（v220〜）。
- **年度集計**: ダッシュボードのカード数値はフロントエンドが `memberRows` から再計算（バックエンドの `individualCount` 等は UI 未使用）。

## 4. 直近の重要履歴

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

## 5. 現時点の注意事項（v221 更新）

- **fixed deployment 2 本は `@226`** を向いている（GAS version 226）。
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
- fixed deployment 2 本が `@226`（versionNumber: 226）
- healthCheck が `ok: true` を返す
- `getDbInfo` が本番固定 DB `1GVlIzOG1Tsqw8fBXgZ__c8u4oMu-4_WCf0H3aVLESKs` を返す

**⚠️ `clasp run` が失敗する場合**: 再ログイン後にproject-scoped OAuth が必要。
```bash
npx clasp login --creds .tmp/oauth-client-hcmn-member-system-prod.json --use-project-scopes --no-localhost
```
ブラウザで認証後、リダイレクト URL の `code=` の値をターミナルにペーストする。

2026-04-17 確認結果（v226）:
- `npm run typecheck` → pass
- `npm run build:gas` → pass（member ~241 kB / public ~162 kB）
- `npx clasp push --force` → 4 files pushed
- `npx clasp version` → version 226 created
- `npx clasp deployments --json` → member + public ともに `versionNumber: 226` ✅
- `npx clasp run healthCheck` → ❌ project-scoped OAuth 再設定が必要（既知問題）

## 7. 次担当者（Codex）の最初の一手

1. `docs/44_DEVELOPMENT_HANDOVER_PLAYBOOK_2026-04-04.md` の「作業開始チェック」を実施する。
2. 再開時チェック（セクション 6）を実行し、deployment が `@226` であることを確認する。
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
