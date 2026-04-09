# 開発引継ぎ

更新日: 2026-04-09
現行本番: `v187`
固定 deployment: member `@187` / public `@187`
補足: `v187` で研修フォームの法定外研修フラグをタイトル上部へ移動・設定画面に sticky 保存バーを追加。`v186` は研修フォーム UX 大幅改善（参加費無料ラベル・申込日デフォルト・連絡先分割・デフォルト表示設定画面）。次タスク: サイト全体の読み込み/書き込み速度改善（詳細は `docs/58_NEXT_TASK_PERFORMANCE_2026-04-09.md`）。

## 1. 最初に読むもの
1. `HANDOVER.md`
2. `AGENTS.md`
3. `GLOBAL_GROUND_RULES/docs/AI_RULES/05_PROJECT_RULES_HIRAKATA.md`
4. `docs/44_DEVELOPMENT_HANDOVER_PLAYBOOK_2026-04-04.md`
5. `docs/58_NEXT_TASK_PERFORMANCE_2026-04-09.md` ← **次タスク仕様書（必読）**
6. `docs/57_RELEASE_STATE_v187_2026-04-09.md`
7. `docs/56_RELEASE_STATE_v186_2026-04-09.md`
8. `docs/55_RELEASE_STATE_v179_v185_2026-04-09.md`
9. `docs/09_DEPLOYMENT_POLICY.md`
10. `docs/05_AUTH_AND_ROLE_SPEC.md`
11. `docs/04_DB_OPERATION_RUNBOOK.md`
12. `docs/03_DATA_MODEL.md`

## 2. 現在の引継ぎ結論
- 開発の入口は `HANDOVER.md`、運用手順の正本は `docs/44_DEVELOPMENT_HANDOVER_PLAYBOOK_2026-04-04.md`。
- 本番状態の判断は `HANDOVER.md`、作業の進め方と完了条件は `docs/44_DEVELOPMENT_HANDOVER_PLAYBOOK_2026-04-04.md` に記録する。
- 最新の release state 文書は `HANDOVER.md` の「最初に読むもの」に記載されたものを参照する。
- task 単位の個票は `docs/31_HANDOVER_TASK_TEMPLATE.md` を複製して管理する。
- 既存 worktree には無関係な差分がある。明示指示なしに revert しない。

## 3. 現在の本番状態
- ブランチ運用の基準は `main`。
- 両 fixed deployment は `@177` を向いている前提で引継ぐ。
- fixed deployment の標準同期方法は `npx clasp redeploy`。Apps Script UI `Manage deployments` は障害復旧時の補助手段に限定する。
- member portal は sidebar logout を採用済み。
- デモログイン、mock member route、画面内 demo selector は廃止済み。
- business member は `REPRESENTATIVE` 行を代表者情報の正本とする。
- 個人会員 / 居宅介護支援事業者所属でない会員は、`officeName` が空または `????` の場合に所属なしとして正規化する。

## 4. 直近の重要履歴
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

## 5. 現時点の注意事項（v185 更新）
- fixed deployment 2 本は `@185` を向いている。
- データ移行期バリデーション緩和は全主要編集フォーム（StaffDetailAdmin / MemberForm / MemberDetailAdmin）に適用完了。
- バリデーション緩和は「初回ロード時に空だったフィールド」のみが対象。保存後に再度フォームを開くと、そのフィールドは埋まっているため通常の必須チェックに戻る。
- GAS キャッシュ（TTL 300 秒）が切れるまで旧データが表示される場合がある。

## 6. 再開時チェック
```bash
git status --short
cd backend
npx clasp show-authorized-user
npx clasp run healthCheck
npx clasp run getDbInfo
npx clasp deployments --json
```

期待値:
- authorized user が運用アカウント
- health check が成功
- fixed deployment 2 本が `@185`

## 7. 次担当者の最初の一手
1. `docs/44_DEVELOPMENT_HANDOVER_PLAYBOOK_2026-04-04.md` の「作業開始チェック」を実施する。
2. 管理者ログインで管理コンソールを開き、「事業所職員」数が事業所会員数より多いことを確認する。
3. デフォルトフィルタが「最新年度・全種別・在籍中」になっていることを確認する。
4. 触る機能に対応する正本を再確認し、追加作業がある場合は `docs/31_HANDOVER_TASK_TEMPLATE.md` から個票を作る。
5. 変更後は `HANDOVER.md` と関連正本を同ターンで更新する。

## 8. 引継ぎ体制メモ
- 入口は `HANDOVER.md`、日次運用は `docs/44_DEVELOPMENT_HANDOVER_PLAYBOOK_2026-04-04.md`、固定記録は `HANDOVER.md` に記載された最新の release state 文書を参照する。
- グランドルール入口は `AGENTS.md` のみ。`CLAUDE.md` は `AGENTS.md` へつなぐ互換入口としてのみ保持する。
- 新規 task は現行テンプレート `docs/31_HANDOVER_TASK_TEMPLATE.md` を複製して起票する。
