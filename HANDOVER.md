# 開発引継ぎ

更新日: 2026-04-16
現行本番: `v221`（GAS version 221）
固定 deployment: member `@221` / public `@221`
補足: v220 でセイ・メイ自動変換 + 年度内在籍判定修正。v221 で joinedDate 空会員の年度除外バグ修正。
v219 以前の変更も継続有効。

## 1. 最初に読むもの
1. `HANDOVER.md`
2. `AGENTS.md`
3. `GLOBAL_GROUND_RULES/docs/AI_RULES/05_PROJECT_RULES_HIRAKATA.md`
4. `docs/44_DEVELOPMENT_HANDOVER_PLAYBOOK_2026-04-04.md`
5. `docs/84_RELEASE_STATE_v221_2026-04-16.md` ← **v221 current**（年度集計バグ修正 + セイ・メイ変換）
6. `docs/83_RELEASE_STATE_v216_2026-04-16.md`（v216 record: 個人会員編集バリデーション見直し）
7. `docs/80_RELEASE_STATE_v209_2026-04-16.md`（v209 record: 入会時認証情報メール送信制御）
8. `docs/79_HANDOVER_2026-04-15.md` ← 引継ぎ資料（v208 時点）— 機能一覧・運用・落とし穴まとめ
9. `docs/78_RELEASE_STATE_v208_2026-04-15.md`（v208 record）
10. `docs/77_RELEASE_STATE_v207_2026-04-15.md`（v207 record）
11. `docs/76_RELEASE_STATE_v206_2026-04-15.md`（v206 record）
12. `docs/75_RELEASE_STATE_v205_2026-04-14.md`（v205 record）
13. `docs/63_SOW_ROSTER_PDF_AND_BULK_MAIL_2026-04-10.md` ← **全フェーズ完了（Phase 1〜3）**
14. `docs/58_NEXT_TASK_PERFORMANCE_2026-04-09.md`（B-02 未着手・残課題）
15. `docs/09_DEPLOYMENT_POLICY.md`
16. `docs/05_AUTH_AND_ROLE_SPEC.md`
17. `docs/04_DB_OPERATION_RUNBOOK.md`
18. `docs/03_DATA_MODEL.md`
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
- 両 fixed deployment は `@221` を向いている（GAS version 221）。
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

- **fixed deployment 2 本は `@221`** を向いている（GAS version 221）。
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
npx clasp run healthCheck
npx clasp run getDbInfo
npx clasp deployments --json
```

期待値:
- authorized user が運用アカウント（`k.noguchi@hcm-n.org`）
- health check が成功
- fixed deployment 2 本が `@221`（versionNumber: 221）
- `getDbInfo` が本番固定 DB `1GVlIzOG1Tsqw8fBXgZ__c8u4oMu-4_WCf0H3aVLESKs` を返す

2026-04-16 確認結果（v221）:
- `npx clasp push --force` → 4 files pushed (GAS version 221)
- `npx clasp deployments --json` → member / public ともに `versionNumber: 221`
- `npm run build:gas` → pass（TypeScript エラーなし）
- `npx tsc --noEmit` → pass

## 7. 次担当者（Codex）の最初の一手

1. `docs/44_DEVELOPMENT_HANDOVER_PLAYBOOK_2026-04-04.md` の「作業開始チェック」を実施する。
2. 再開時チェック（セクション 6）を実行し、deployment が `@221` であることを確認する。
3. **管理コンソール（会員管理）の数値を確認する**:
   - 2026年度フィルターで個人会員数 ≒ 宛名リストの個人会員数になっていることを目視確認
   - 差が残る場合は `joinedDate` が未設定の会員が残っている可能性（管理コンソールから補完）
4. **セイ・メイ入力の動作確認**:
   - 全角カナ（例:「ヤマダ」）で入力 → 保存 → 半角カナ（「ﾔﾏﾀﾞ」）に変換されることを確認
   - ひらがな（例:「やまだ」）でも同様に変換されることを確認
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
