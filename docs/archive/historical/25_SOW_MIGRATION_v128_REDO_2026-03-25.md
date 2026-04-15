# v128 再移行 SOW

更新日: 2026-03-25
対象: v128 名簿データ再移行

## 1. 目的
- 2026-03-24 の誤移行済みDBを、安全にクリアして再移行する。
- 移行データの漏れ、重複、崩れ、監査不能を防ぐ。
- 実行前・実行中・実行後の判断基準を固定し、手順逸脱を防ぐ。

## 2. 成果物
- 再移行済み DB
- `_MIGRATION_SUMMARY`
- `_MIGRATION_MAP`
- `_MIGRATION_SKIPPED`
- `_CREDENTIALS_TEMP`
- 実行時バックアップ `_BAK_*`
- [v128 再移行 テーブル設計書](C:/VSCode/CloudePL/hirakatacitykyougikaiIDE/docs/24_TABLE_DESIGN_MIGRATION_v128_REDO_2026-03-25.md)

## 3. スコープ

### 3.1 対象
- `T_会員`
- `T_事業所職員`
- `T_認証アカウント`
- `T_年会費納入履歴`
- `T_年会費更新履歴`
- `T_ログイン履歴`
- 移行専用シート `_MIGRATION_*` と `_CREDENTIALS_TEMP`

### 3.2 対象外
- 本番 Deployment 更新
- `T_事業所職員` 姓名分離
- フロントエンド機能改修
- 会員通知送信

## 4. 前提条件
- ソースシート `★会員名簿 / 2025年度` の編集を実行中に止める。
- `backend/Code.gs` は修正版が `clasp push` 済みであること。
- `dryRunMigration` のベースラインが以下と一致すること。
  - `T_会員=211`
  - `T_事業所職員=147`
  - `T_認証アカウント=326`
  - `T_年会費納入履歴=344`
  - `skippedRows=58 (EMPTY_ROW only)`
  - `sourceCoverage.ok=true`
- 2026-03-25 のユーザー承認に基づき、誤移行済みの現行DBをバックアップ後にクリアしてよい。

## 5. 実行方針
- 直接本番投入せず、必ず `dryRunMigration` → 監査確認 → `executeMigration` の順で進める。
- 1 実行 1 `runId` とし、並行実行しない。
- 実行中にソーススキーマ、ソースデータ、ターゲットスキーマを変更しない。
- 失敗時はその場で停止し、新規バックアップ suffix を用いてロールバック可能にする。

## 6. 実施手順

### Phase 1: 事前確認
1. `git status --short`
2. `npx clasp run healthCheck`
3. `npx clasp run getDbInfo`
4. `npx clasp run dryRunMigration`
5. `_MIGRATION_SUMMARY` / `_MIGRATION_MAP` / `_MIGRATION_SKIPPED` を確認

### Phase 2: 実行判定
- 以下をすべて満たした場合のみ本番再移行へ進む。
  - `errors=0`
  - `warnings=0`
  - `sourceCoverage.ok=true`
  - `skippedRows=58`
  - `reasonCode=EMPTY_ROW` のみ
  - ベースライン件数一致
  - 管理者確認対象行が `_MIGRATION_MAP` に存在

### Phase 3: 本番再移行
1. `npx clasp run executeMigration`
2. 生成された `backupSuffix` を記録
3. `verification.integrityOk=true` を確認
4. `_CREDENTIALS_TEMP` を確認

### Phase 4: 実行後確認
1. `npx clasp run verifyMigration_`
2. `_MIGRATION_SUMMARY` の最終件数確認
3. `T_管理者Googleホワイトリスト` の `k.noguchi@uguisunosato.or.jp` 紐付け確認
4. `HANDOVER.md` と関連正本へ最終件数・実行日時・backupSuffix を反映

## 7. 受入条件
- 実行結果がベースライン件数と一致する。
- 参照整合性エラーが 0 件。
- `野口　健太` を含む確認対象が DB 内に存在する。
- 認証アカウント件数が 326 件で一致する。
- 会費レコード件数が 344 件で一致する。
- `_MIGRATION_MAP` と `_MIGRATION_SKIPPED` が保存され、監査可能である。
- `reconcileMigrationWithSource.ok=true`

## 8. 停止条件
- `dryRunMigration` の件数がベースラインからずれる。
- `reasonCode` に `EMPTY_ROW` 以外が出る。
- `verifyMigration_.integrityOk=false`
- ソースシートに実行中変更が入ったことが判明する。
- Apps Script 実行エラー、タイムアウト、権限エラーが出る。

## 9. ロールバック条件と方法
- 条件:
  - 件数不一致
  - 参照整合性エラー
  - 管理者確認対象の欠落
  - 認証情報生成異常
- 方法:
  - `executeMigration` 実行時に取得した `backupSuffix` で `rollbackMigration_('<backupSuffix>')` を実行する
  - 2026-03-24 実行前の原本へ戻す必要がある場合は `_BAK_20260324_132929` を使用する

## 10. リスク管理
- スキーマ変更と移行実行を同日同時にしない。
- 本番 Deployment 更新を同じ作業窓で混在させない。
- `_CREDENTIALS_TEMP` は再移行後に再生成されるため、旧値を通知に使わない。
- 移行中にソース変更が起きると監査値が崩れるため、事前に編集停止を共有する。

## 11. 外部根拠
- Google Cloud は移行検証として、テーブル作成確認、スキーマ対応確認、行数一致、ランダム行抽出、集計値比較、行レベルハッシュ比較を推奨している。
  - https://docs.cloud.google.com/spanner/docs/data-validation
- Google Cloud は、移行開始後に作成されたオブジェクトや、実行中のスキーマ変更は自動反映されないと明記している。
  - https://docs.cloud.google.com/database-migration/docs/sqlserver-to-csql-pgsql/known-limitations
- AWS は cutover のリスクはダウンタイム制約と業務重要度に比例し、事前計画とガバナンスが重要だとしている。
  - https://docs.aws.amazon.com/prescriptive-guidance/latest/best-practices-migration-cutover/overview-cutover-phase.html
- Microsoft は staging layer を用いた変換・検証・監査可能な移行を推奨している。
  - https://learn.microsoft.com/en-us/power-platform/architecture/key-concepts/data-migration/staging-database-approach
