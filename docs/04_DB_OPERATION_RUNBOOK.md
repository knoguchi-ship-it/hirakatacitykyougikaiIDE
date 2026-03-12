# DB運用ランブック（スプレッドシート）

## 1. 目的
- 本システムのDB（Googleスプレッドシート）を、定義どおりに自動構築・再構築・清掃するための運用手順を記録する。

## 2. 対象DB
- 名称: `枚方市ケアマネ協議会_DB`（`backend/Code.gs` の `DB_SPREADSHEET_NAME` 変数の値）
  - 注: この名称は新規スプレッドシート作成時のみ使用。本番は固定IDで管理。
- スプレッドシートID: `1GVlIzOG1Tsqw8fBXgZ__c8u4oMu-4_WCf0H3aVLESKs`
- 参照コード: `backend/Code.gs` の `DB_SPREADSHEET_ID_FIXED`

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

## 5. 検証ポイント
- 不要シート `シート1` が存在しないこと
- 以下のシートが存在すること（Code.gs `マスタ定義` / `テーブル定義` に準拠）
  - マスタシート: `M_会員種別`, `M_会員状態`, `M_発送方法`, `M_郵送先区分`, `M_職員権限`, `M_職員状態`, `M_システムロール`, `M_研修状態`, `M_申込状態`, `M_会費納入状態`, `M_申込者区分`（2026-03-12追加）
  - テーブルシート: `T_会員`, `T_システム設定`, `T_事業所職員`, `T_認証アカウント`, `T_ログイン履歴`, `T_管理者Googleホワイトリスト`, `T_画面項目権限`, `T_研修`, `T_研修申込`, `T_年会費納入履歴`, `T_外部申込者`（2026-03-12追加）
- **廃止済みシート** `M_開催形式` は定義から除外済み。存在する場合は `cleanupDatabaseSheets()` で自動削除される。

## 5.1 認証関連の運用検証
1. 会員認証
  - `T_認証アカウント` で `認証方式=PASSWORD` のレコードが存在すること
  - `ログインID` が重複していないこと
2. 管理者認証（セッション認証: 本番標準）
  - `T_管理者Googleホワイトリスト` に `有効フラグ=true` で `Googleメール` が登録されていること
  - `紐付け認証ID` / `紐付け会員ID` が `T_認証アカウント` / `T_会員` と一致すること
3. 監査
  - `T_ログイン履歴.認証方式` に `PASSWORD` または `GOOGLE` が記録されること

## 5.2 会費・研修表示の運用検証
1. 会費
  - `T_年会費納入履歴` の最新年度が未納の会員で、振込先口座情報が表示されること
  - 納入済の会員では振込先表示が出ないこと
2. 研修
  - 受付中研修で詳細本文が表示できること
  - 案内PDFリンクが有効で閲覧できること

## 6. 注意事項
- 運用アカウントは `k.noguchi@uguisunosato.or.jp` のみ使用する。
- 定義外シートを保持したい場合は、関数実行前に要件へ反映（`マスタ定義`/`テーブル定義` へ追加）する。

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
