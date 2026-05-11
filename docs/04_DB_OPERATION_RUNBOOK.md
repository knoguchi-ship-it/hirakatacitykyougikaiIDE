# DB運用ランブック（スプレッドシート）

更新日: 2026-05-11

## 1. 目的
- 本システムのDB（Googleスプレッドシート）を、定義どおりに自動構築・再構築・清掃するための運用手順を記録する。

## 2. 対象DB
- 名称: `枚方市ケアマネ協議会_DB`（`backend/Code.gs` の `DB_SPREADSHEET_NAME` 変数の値）
  - 注: この名称は新規スプレッドシート作成時のみ使用。本番は固定IDで管理。
- スプレッドシートID: `1GVlIzOG1Tsqw8fBXgZ__c8u4oMu-4_WCf0H3aVLESKs`
- 参照コード: `backend/Code.gs` の `DB_SPREADSHEET_ID_FIXED`

### 2.1 ログ SS

- 名称: ログイン履歴・監査ログ・メール送信ログ用スプレッドシート
- スプレッドシートID: `1NmVv483UeehF8dqCdyNKOqOtv_fPKROhHN7011N23lw`
- 参照コード: `getLogSs_()`
- `LOG_SPREADSHEET_ID` Script Property が未設定の場合はメイン DB にフォールバックするが、現行本番運用ではログ SS 分離を正とする。

## 3. 自動構築関数（Apps Script）
- `setupDatabase()`
  - マスタ/テーブルを作成
  - 初期値投入
  - 入力規則設定
  - ヘッダー保護設定
  - 定義外シート削除（例: `シート1`）

- `rebuildDatabaseSchema()`
  - 定義に沿ってDB構造を再構築
  - 定義外シートを削除
  - 返却値に削除シート一覧を含む

- `cleanupDatabaseSheets()`
  - 定義外シートのみ削除
  - 返却値に削除シート一覧を含む

## 4. 実行手順（Apps Scriptエディタ）
1. 対象プロジェクトを開く
2. 関数選択で `cleanupDatabaseSheets`（または `setupDatabase`）を選択
3. `実行` を押す
4. `実行完了` を確認する

### 4.1 スキーマ変更時の標準手順

テーブル定義を変更した場合は、既存データを保持する差分正規化を原則とする。

1. 変更前に本番スプレッドシートのバックアップを取得する。
2. `gas/admin/Code.gs` 末尾に、対象テーブルだけを `normalizeTableColumns_()` する一時関数を追加する。
3. `cd gas/admin && npx clasp push --force` を実行する。
4. Apps Script エディタから一時関数を手動実行する。
5. 対象シートの列追加・列順・既存データ保持を確認する。
6. 一時関数を削除し、`push -> version -> redeploy` で clean 版へ戻す。
7. `docs/03_DATA_MODEL.md`、本ランブック、`HANDOVER.md`、release state を更新する。

`clasp run` は project-scoped OAuth の制約で通常認証では失敗することがあるため、本番 DB スキーマ変更は Apps Script エディタ経由を標準とする。

## 5. 検証ポイント
- 不要シート `シート1` が存在しないこと
- 以下のシートが存在すること（Code.gs `マスタ定義` / `テーブル定義` に準拠）
  - マスタシート: `M_会員種別`, `M_会員状態`, `M_発送方法`, `M_郵送先区分`, `M_職員権限`, `M_職員状態`, `M_システムロール`, `M_研修状態`, `M_申込状態`, `M_会費納入状態`, `M_申込者区分`, `M_管理者権限`, `M_組織マスタ`, `M_役職マスタ`, `M_支払い種別マスタ`, `M_業務分類`
  - メインDBテーブルシート: `T_会員`, `T_システム設定`, `T_事業所職員`, `T_認証アカウント`, `T_管理者Googleホワイトリスト`, `T_画面項目権限`, `T_研修`, `T_研修申込`, `T_年会費納入履歴`, `T_年会費更新履歴`, `T_外部申込者`, `T_会員_archive`, `T_事業所職員_archive`, `T_変更申請`, `T_役員`, `T_振込口座`, `T_支払い`, `T_支払い明細`, `T_請求`
  - ログSSテーブルシート: `T_ログイン履歴`, `T_監査ログ`, `T_メール送信ログ`
- **廃止済みシート** `M_開催形式` は定義から除外済み。存在する場合は `cleanupDatabaseSheets()` で自動削除される。
- メイン DB 側の `T_ログイン履歴`, `T_監査ログ`, `T_メール送信ログ` は v261 以降廃止済み。ログ SS 側に存在することを確認する。

## 5.1 認証関連の運用検証
1. 会員認証
  - `T_認証アカウント` で `認証方式=PASSWORD` のレコードが存在すること
  - `ログインID` が重複していないこと
2. 管理者認証（セッション認証: 本番標準）
  - `T_管理者Googleホワイトリスト` に `有効フラグ=true` で `Googleメール` が登録されていること
  - `紐付け認証ID` / `紐付け会員ID` が `T_認証アカウント` / `T_会員` と一致すること
3. 監査
  - ログ SS の `T_ログイン履歴.認証方式` に `PASSWORD` または `GOOGLE` が記録されること

## 5.2 会員テスト認証の再生成（非破壊）
- 目的: 本番データを消去せず、会員ログイン検証用アカウントだけを再生成する。
- 実行関数: `provisionTestMemberAccounts()`
- 実行場所: Apps Script エディタ（関数選択して実行）
- 挙動:
  - `T_認証アカウント` の対象3件を upsert（存在しなければ追加、あれば更新）
  - 対象: `12345678`, `87654321`, `11223344`
  - パスワードをユーザー側で管理するテスト用パスワードに再設定
  - `ログイン失敗回数=0`, `ロック状態=false`, `アカウント有効フラグ=true`, `削除フラグ=false` に補正
- 注意:
  - `seedDemoData()` はテーブルデータを広範囲に再投入するため、通常運用では使用しない。
  - この手順は `T_認証アカウント` の対象行のみ更新する。

## 5.2.1 負荷試験データの再生成（非破壊・2026-03-15 追加）
- 目的: 大量会員データを前提に、会員画面・管理画面の応答と整合性を検証する。
- 実行関数: `seedPerformanceTestData()`
- 実行場所: CLI または Apps Script エディタ
- コマンド例:
```bash
npx clasp run seedPerformanceTestData
```
- 挙動:
  - 既存の通常本番データは保持する。
  - 以前に生成した `LT...` 系の会員、職員、認証、年会費、研修、申込データのみ削除して再生成する。
  - 生成件数は `個人会員 300名 / 事業所会員 30件 / 事業所職員 205名 / 認証アカウント 505件 / 年会費 660件 / 研修 8件 / 申込 378件`。
  - ログインIDは `20000001` からの連番、共通パスワードは `test`。
  - 会費納入状況と研修申込状況は乱数で生成するが、`会員ID・申込者ID・申込者数` の整合は維持する。
- 注意:
  - 既存データを全面初期化しないため、本番環境でも投入自体は非破壊だが、件数増加により一覧系の表示負荷は上がる。
  - 生成されたデータは `負荷 ...` / `LTM-...` / `LTT-...` で識別する。

## 5.3 会費・研修表示の運用検証
1. 会費
  - `T_年会費納入履歴` の最新年度が未納の会員で、振込先口座情報が表示されること
  - `T_システム設定.ANNUAL_FEE_PAYMENT_GUIDANCE` の文面が、未納会員の「納入方法を見る」に反映されること
  - `T_システム設定.ANNUAL_FEE_TRANSFER_ACCOUNT` の内容を変更すると、未納会員の振込先表示へ反映されること
  - 納入済の会員では振込先表示が出ないこと
  - 同一会員・同一年度の年会費レコードが重複していないこと
  - `PAID` レコードでは `納入確認日` が空でないこと
  - 年会費管理コンソールからの更新時に `T_年会費更新履歴` へ監査ログが追記されること
2. 研修
  - 受付中研修で詳細本文が表示できること
  - 案内PDFリンクが有効で閲覧できること

## 5.4 年会費管理コンソールの運用検証（2026-03-15 追加）
1. 一覧
  - 対象年度・納入状況・会員種別・会員番号/氏名で絞り込めること
  - 一覧に `対象年度 / 会員番号 / 氏名・事業所 / 会員種別 / 納入状況 / 納入確認日 / 金額 / 備考 / 保存` が表示されること
  - 対象年度では、年度途中退会者を含む年度内会員が一覧に現れ、年度開始前退会者・年度末後入会者は対象外になること
  - 年度内会員で年会費レコード未作成の場合のみ「未納」として扱い、保存時に当該年度のレコードを新規作成できること
2. 更新
  - `PAID` 変更時に `納入確認日` 必須チェックが動作すること
  - `UNPAID` 変更時に `納入確認日` を空にできること
  - 金額は `M_会員種別.年会費金額` から自動表示され、画面編集できないこと
  - 保存後に会員マイページの年会費表示へ反映されること
3. 監査
  - `T_年会費更新履歴` に `操作種別 / 実行者メール / 実行日時 / 更新前JSON / 更新後JSON` が記録されること

## 5.5 役員・請求管理の運用検証（v295〜v297）

1. スキーマ
  - `M_組織マスタ`, `M_役職マスタ`, `M_支払い種別マスタ` が存在すること。
  - `T_役員`, `T_振込口座`, `T_支払い`, `T_支払い明細`, `T_請求` が存在すること。
  - `T_役員`, `T_振込口座`, `T_請求` に `会員ID` と `職員ID` が存在すること。
2. XOR 制約
  - 個人会員・賛助会員の役員行は `会員ID` が non-empty、`職員ID` が empty であること。
  - 事業所職員の役員行は `会員ID` が empty、`職員ID` が non-empty であること。
  - `会員ID` と `職員ID` が同時に入る行、または両方空の行がないこと。
3. 口座
  - 事業所職員型役員の `T_振込口座` 行も `職員ID` で所有者を識別できること。
  - 同一人物が複数役職を兼務しても、口座は人物単位で重複しないこと。
4. 請求
  - 会員マイページからの請求保存時、ログイン主体の `会員ID` または `職員ID` と一致する所有者のみ保存・閲覧できること。
  - 添付ファイルは Drive に保存され、`T_請求.添付ファイルURL` に JSON 配列として記録されること。
5. 退職・紐づけ変更
  - 事業所職員を `LEFT` にした場合、現役役員が自動退任されること。
  - 役員の個人会員/事業所職員紐づけ変更時、`T_振込口座` の所有者も連動移行すること。

## 5.6 活動報告・経費請求の運用検証（v333）

1. スキーマ
  - `M_組織マスタ` に `全役員表示フラグ` が存在すること。
  - `M_業務分類` が存在し、`業務分類コード`, `業務分類名`, `組織コード`, `単価` を持つこと。
  - `T_請求` に `請求種別`, `業務分類コード`, `単価`, `数量` が存在すること。
2. 活動報告
  - 会員マイページで、ログイン中役員の所属組織と `全役員表示フラグ=true` の組織だけが活動部に表示されること。
  - 活動部を選ぶと、その組織に紐づく有効な業務分類だけが表示されること。
  - 業務分類を選ぶと単価が表示され、保存時の `請求金額` が `単価 × 1` になること。
3. 経費請求
  - 添付なしでは保存不可であること。
  - PDF / JPG / PNG / HEIC を選択でき、HEIC は会員側で JPG に変換されて Drive へ保存されること。
  - 請求金額は半角数値のみ入力でき、サーバー側でも 1 円以上を検証すること。
4. 管理者確認
  - 請求管理コンソールで活動報告 / 経費請求をフィルタできること。
  - 活動報告では業務分類・単価・数量を確認できること。
  - 経費請求では添付有無を確認したうえで承認・却下できること。

## 6. 注意事項
- 運用アカウントは `k.noguchi@hcm-n.org` を正とする。
- 定義外シートを保持したい場合は、関数実行前に要件へ反映（`マスタ定義`/`テーブル定義` へ追加）する。

## 6.1 危険操作リスト
### `seedDemoData()`
- 対象: 本番固定 DB (`DB_SPREADSHEET_ID_FIXED`)
- 動作: 会員・職員・認証・管理者ホワイトリスト・研修・申込・年会費などの本番運用データを広範囲に削除し、デモデータで置き換える。実装時点のテーブル定義により、追加テーブルも初期化・再投入対象になり得る。
- 影響: 管理者ホワイトリストや会員一覧を含む本番運用データを破壊する。
- 用途: 開発・検証専用。本番運用 DB に対して通常運用で実行してはならない。
- 必須条件: 実行前にスプレッドシート版歴または外部バックアップを確保し、ロールバック手段を記録する。

## 6.2 2026-04-04 の運用記録
- 同日中の DB 復旧作業は最終的にロールバックされた。
- 現在は、ユーザーが整合性確認済みの DB 状態を本番基準として扱う。
- 以後の DB 変更作業では、変更前バックアップ取得、ロールバック手順、変更後の `healthCheck` / `getDbInfo` 確認を必須とする。

## 追補（2026-03-07: 研修問い合わせデータ補完手順）
- 目的: 研修の問い合わせ先データの漏れ（全件/アーカイブ）を確認して再補完する。
- 確認:
```bash
npx clasp run auditTrainingInquiryContacts
```
- 補完:
```bash
npx clasp run backfillTrainingInquiryContacts
```
- 再確認:
```bash
npx clasp run auditTrainingInquiryContacts
```
- 終了:
  - `missingCount: 0` で終了

## 追補（2026-03-07: Webアプリ404のデフォルト対応）
- 症状: 本番 `/exec` が 404 を返す。
- 第一仮説: デプロイが **Web app** ではなく **API executable** のみになっている。
- 標準対応（毎回この順序で実施）:
  1. `npx clasp deployments` で最新デプロイを確認
  2. Apps Script の `Manage deployments` で種別を確認（Web app 必須）
  3. `Execute as: Me` と `Who has access: Anyone` を設定して再デプロイ
  4. `getWebAppEndpointInfo()` 実行で `serviceEnabled` とURLを確認
  5. `/exec` へアクセスして復旧確認
- 再発抑止: 新規デプロイ時は必ず Web app と API executable の両方を確認する。

## 追補（2026-03-08以降: 本番URL固定運用）
- 本番Deployment IDを固定し、版のみ更新する。
- 標準手順は `docs/09_DEPLOYMENT_POLICY.md` を参照。
- 新規Deployment乱立は禁止。404再発防止を最優先とする。

---

## v305 Operational Verification: Fiscal-Year Outputs and Shared Search

Status: production `v305` / admin split `@65`.

### Mailing List / Roster Fiscal-Year Checks

Use a target fiscal year such as `2025年度` and verify the following from the admin console:

1. Members whose `退会日` is before `2025-04-01` do not appear in fiscal-year targets.
2. Members whose `入会日` is after `2026-03-31` do not appear in fiscal-year targets.
3. Members who withdrew between `2025-04-01` and `2026-03-31` remain eligible for `2025年度` output and are shown as fiscal-year withdrawn/年度内退会 where applicable.
4. Annual-fee status `未納` includes missing `T_年会費納入履歴` rows only for members eligible in the selected fiscal year.
5. Changing the selected fiscal year changes the eligibility reference dates; the current date must not affect these output filters.

### Shared Search Checks

Run the same search behavior checks anywhere shared member/person search is used:

- `山田太郎` finds records stored/displayed as `山田 太郎`.
- `山田 太郎` finds records stored/displayed as `山田太郎`.
- Full-width spaces and half-width spaces are equivalent.
- Existing searches by member number, office name, email, and kana still work.

### Evidence to Record

Record the target fiscal year, selected filters, expected included/excluded sample member IDs, and whether each screen uses the shared search behavior. Do not record secret values or personal data beyond the minimum member IDs needed for verification.
