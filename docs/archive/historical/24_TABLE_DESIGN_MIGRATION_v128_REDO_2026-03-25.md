# v128 再移行 テーブル設計書

更新日: 2026-03-25
対象: ★会員名簿 2025年度シート → 本番スプレッドシートDB 再移行
対象実装: `backend/Code.gs` の `migrateRoster2025_` / `dryRunMigration` / `executeMigration`

## 1. 目的
- 現在の誤移行済みデータを監査可能な形で全件再移行する。
- データ崩れ、取りこぼし、監査不能を防ぐ。
- 本移行ではアプリ本体の業務テーブル定義を増減させず、移行専用の監査シートで完全性を担保する。

## 2. この作業の設計原則
- 移行対象データは実行開始前に固定する。実行中にソースシートを変更しない。
- 移行中に対象テーブルのスキーマ変更をしない。
- 本番書き込み前に `dryRunMigration` を実行し、件数とスキップ理由を確認する。
- 本番書き込み時は必ずバックアップを取得し、必要時は即時ロールバックできる状態を維持する。
- ソース行単位の追跡を必須とし、`_MIGRATION_MAP` と `_MIGRATION_SKIPPED` を正本監査ログとする。
- 実行のべき等性は「対象テーブルを空にしてから再投入する」前提で確保する。

## 3. 対象テーブル

### 3.1 読み取り元
- ソーススプレッドシート: `★会員名簿`
- シート: `2025年度`
- 行構成: ヘッダー1行 + データ行326行

### 3.2 書き込み先
- `T_会員`
- `T_事業所職員`
- `T_認証アカウント`
- `T_年会費納入履歴`
- `T_年会費更新履歴`
- `T_ログイン履歴`

### 3.3 移行専用シート

#### `_MIGRATION_SUMMARY`
- 用途: 実行単位の集計・完了判定
- 主キー相当: `runId + item`
- 列:
  - `runId`
  - `mode`
  - `item`
  - `value`

#### `_MIGRATION_MAP`
- 用途: ソース行と移行先IDの対応表
- 主キー相当: `runId + sourceRow + targetType + targetMemberId + targetStaffId + targetLoginId`
- 列:
  - `runId`
  - `sourceRow`
  - `mergedSourceRows`
  - `explicitMemberType`
  - `effectiveMemberType`
  - `officeName`
  - `name`
  - `cmNumber`
  - `statusEvent`
  - `mergeKey`
  - `targetType`
  - `targetMemberId`
  - `targetStaffId`
  - `targetLoginId`
  - `notes`

#### `_MIGRATION_SKIPPED`
- 用途: スキップ行の理由記録
- 主キー相当: `runId + sourceRow`
- 列:
  - `runId`
  - `sourceRow`
  - `explicitMemberType`
  - `effectiveMemberType`
  - `officeName`
  - `name`
  - `furigana`
  - `cmNumber`
  - `statusEvent`
  - `reasonCode`
  - `reason`

#### `_CREDENTIALS_TEMP`
- 用途: 再移行で再生成された認証情報の一次保管
- 備考: 会員通知前に事務局確認を必須とする

#### `_BAK_*`
- 用途: 対象テーブルの世代バックアップ
- 命名: `_BAK_<timestamp>_<tableName>`
- 備考: 再移行前の現在DB状態も別世代で保持する

## 4. ソース列と移行ルール

### 4.1 主要入力列
- `A`: 2024年度会費
- `B`: 2025年度個人会費
- `C`: 2025年度事業所会費
- `D`: 会員種別
- `E`: 状態イベント
- `F`: 備考
- `I`: 郵送先
- `J`: メールアドレス
- `K`: 勤務先
- `L`: 氏名
- `M`: 介護支援専門員番号
- `N`: フリガナ
- `O`-`U`: 住所・電話・FAX・連絡先

### 4.2 行判定ルール
- `D` と他主要列が空の行は `EMPTY_ROW` として `_MIGRATION_SKIPPED` に出力する。
- `D` が空でも有効データがあり、直前事業所を継承できる場合のみ `事業所` として補完する。
- `E=変更` は一律スキップしない。現行ルールでは単独レコードとして採用し、`_MIGRATION_MAP.notes` に記録する。
- `E=退会` または `N` に漢字が入る行は退会者として扱う。
- `氏名` が空でも `フリガナ` が漢字の退会者は `フリガナ` を氏名原本として採用する。
- CM番号重複時は、ログインIDに `先頭1桁の振り番 + 元の8桁CM番号` の9桁を採用する。

### 4.3 会員・職員生成ルール
- `個人` は `T_会員` 1件 + `T_認証アカウント` 1件を生成する。
- `事業所` は `勤務先` 単位で `T_会員` 1件を生成し、各行を `T_事業所職員` と `T_認証アカウント` に展開する。
- 代表者は `郵送先=所属先` の在籍職員を優先し、該当なしなら先頭在籍職員、それもなければ先頭行とする。
- 退会済み職員は `職員状態コード=LEFT`、認証は無効化する。

### 4.4 年会費生成ルール
- 2024年度個人会費は `A`、2025年度個人会費は `B`、2025年度事業所会費は `C` を使用する。
- `総会` は定義済み総会日へ正規化する。
- 日付文字列は `normalizeRosterDate_()` で正規化する。

## 5. 期待件数ベースライン

### 5.1 2026-03-25 最終実行ベースライン
- runId: `20260325T120805-35e3927e`
- backupSuffix: `_BAK_20260325_120805`
- `T_会員`: 211件
  - 個人: 179件
  - 事業所: 32件
- `T_事業所職員`: 147件
- `T_認証アカウント`: 326件
- `T_年会費納入履歴`: 344件
- `skippedRows`: 58件
  - `EMPTY_ROW`: 58件
- `changeRows`: 19件
  - `changeRowsStandalone`: 19件
  - `changeRowsMerged`: 0件
- `inferredBusinessRows`: 0件
- `mismatchCount`: 0件（`reconcileMigrationWithSource`）

### 5.2 本番実行の受入基準
- `sourceCoverage.ok = true`
- `warnings.length = 0`
- `errors.length = 0`
- `verifyMigration_.integrityOk = true`
- `reconcileMigrationWithSource.ok = true`
- `skippedRows` が 58 件から増減しない
- `reasonCode` は `EMPTY_ROW` のみ
- `野口　健太` を含む管理者確認対象が `_MIGRATION_MAP` に存在する

## 6. この作業で採らないこと
- `T_事業所職員` の姓名分離スキーマ変更
- 本番 Deployment 更新
- 会員通知の実施
- 既存アプリ機能の仕様変更

## 7. 例外運用
- 案件グランドルールでは「既存DBは再作成前提にしない」が原則。
- ただし本作業は、2026-03-24 の誤移行データが既知であり、2026-03-25 にユーザーから「現在のDB内容は全て消して大丈夫」と承認済み。
- よって本作業に限り、`MIGRATION_TARGET_TABLES` をバックアップ後にクリアして再投入する。
- この例外は本ドキュメントと SOW に明示し、通常運用へ一般化しない。

## 8. 外部根拠
- Google Cloud, Validate your data migration: https://docs.cloud.google.com/spanner/docs/data-validation
- Google Cloud, Known limitations and recommendations: https://docs.cloud.google.com/database-migration/docs/sqlserver-to-csql-pgsql/known-limitations
- AWS Prescriptive Guidance, Overview of the cutover phase: https://docs.aws.amazon.com/prescriptive-guidance/latest/best-practices-migration-cutover/overview-cutover-phase.html
- Microsoft Learn, Use a staging database for data migration: https://learn.microsoft.com/en-us/power-platform/architecture/key-concepts/data-migration/staging-database-approach
