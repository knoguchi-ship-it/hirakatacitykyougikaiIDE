# v128 名簿データ移行 — 引継ぎ・解析鑑定書

作成日: 2026-03-25
対象バージョン: v128（コミット `0651721`）
ステータス: **2026-03-25 再移行・DB補正・本番deployment反映済み / 件数・参照整合性OK / migration provenance未収束**

---

## 1. 経緯

★会員名簿スプレッドシート（ID: `1aNKUc-lsJbc-whDY2SWRQW6I_npYnPloTurnyoQxGPQ`）の `2025年度` シート（21列・326データ行）から、本番DB（`1GVlIzOG1Tsqw8fBXgZ__c8u4oMu-4_WCf0H3aVLESKs`）の4テーブルへ一括移行を実施。

### 2026-03-24 実行結果（現在のDB状態）
| テーブル | 件数 |
|----------|------|
| T_会員 | 205件（個人174 + 事業所31） |
| T_事業所職員 | 133件 |
| T_認証アカウント | 307件 |
| T_年会費納入履歴 | 330件 |

### 2026-03-25 修正版 dry-run 結果
| テーブル | 件数 |
|----------|------|
| T_会員 | 211件（個人179 + 事業所32） |
| T_事業所職員 | 146件 |
| T_認証アカウント | 325件 |
| T_年会費納入履歴 | 342件 |

- runId: `20260325T094617-0b730e85`
- `sourceCoverage`: 384 / 384 = `ok`
- `skippedRows`: 58件、すべて `EMPTY_ROW`
- `changeRows`: 19件、`changeRowsStandalone`: 19件、`changeRowsMerged`: 0件
- `inferredBusinessRows`: 0件

### 2026-03-25 再移行実行結果
- runId: `20260325T120805-35e3927e`
- backupSuffix: `_BAK_20260325_120805`
- `T_会員`: 211件（個人179 + 事業所32）
- `T_事業所職員`: 147件
- `T_認証アカウント`: 326件
- `T_年会費納入履歴`: 344件
- `sourceCoverage`: 384 / 384 = `ok`
- `verification.integrityOk = true`
- `verification.integrityErrors = []`
- 2026-03-25 時点の live DB 再確認では `reconcileMigrationWithSource.ok = false`
- `reconcileMigrationWithSource.mappedRowCount = 0`
- `reconcileMigrationWithSource.mismatchCount = 384`
- `getDbInfo` のシート一覧に `_MIGRATION_SUMMARY` / `_MIGRATION_MAP` / `_MIGRATION_SKIPPED` / `_CREDENTIALS_TEMP` は現存しない

### 2026-03-25 DB補正結果
- 実行関数: `repairRosterMigrationDataJson`
- backupSuffix: `_BAK_20260325_182904`
- `memberUpdates = 158`
- `staffUpdates = 0`
- `authUpdates = 0`
- 補正対象: 個人会員の `介護支援専門員番号`
- 補正後 `remainingPreview.memberUpdates = 0`
- `auditCurrentIntegrityJson.integrityOk = true`
- 固定 deployment 2本は `@128` へ更新済み。固定 URL で会員マイページ/公開ポータルを確認済み

### ロールバック手段
- バックアップシート: `_BAK_20260324_132929`
- ロールバック関数: `rollbackMigration_('_BAK_20260324_132929')`
- **修正移行を再実行する前にロールバックを推奨**

---

## 2. 検出済みの問題点

### 問題1: 全会員データを拾えていない（データ完全性の欠落）

**当初症状**: ソース326行のうち、58行が「空行」、19行が「E=変更」としてスキップされ、実質307行しか処理されていない。管理者「野口　健太」を含む一部の会員がDBに存在しない。

**2026-03-25 再確認結果**: 修正版 dry-run では `sourceCoverage=384/384` となり、58行はすべて真の空行、`D列空` からの補完件数は 0 件だった。現時点のソースでは、取りこぼしの主因は `E=変更` の19行未採用だったと判断してよい。

**原因分析**:
- 旧実装では `migrateRoster2025_()` がD列空行を一律スキップしていたため、補完ロジック自体は必要だった
- ただし 2026-03-25 時点の実データでは `inferredBusinessRows=0` で、**D列空の有効行は再現しなかった**
- 現時点の件数差を生んでいた主因は `E=変更` 行の未採用
- 58行のスキップ対象はすべて真の空行で、`_MIGRATION_SKIPPED` に理由付きで出力されるようになった

**修正方針**:
1. スキップ条件を「D列が空」から「L列（氏名）もD列も空」に変更する
2. D列が空でもL列（氏名）に値がある行は、直前の事業所に所属する職員として扱う
3. 58行の「空行」は `_MIGRATION_SKIPPED` で継続監査する

### 問題2: E=変更行の扱い

**症状**: E列が「変更」の19行を完全にスキップしていた。

**原因分析**:
- 2026-03-25 の目視確認では、19件の `変更` 行は少なくとも現行名簿上では単独採用すべき行として並んでいるケースが大半だった
- `changeRowsStandalone=19` / `changeRowsMerged=0` で、現時点のソースでは「既存行へ自動上書き」より「単独レコードとして採用」の方が実態に合う
- 旧ロジックの `変更` 一律スキップが、件数不足の主因だった

**修正方針**:
1. `変更` 行は一律スキップしない
2. まずは単独レコードとして採用し、`_MIGRATION_MAP` に `変更行を最新値として採用` を残す
3. 将来、同一人物の旧行との機械的ペアリング根拠が揃った場合のみ、自動マージを追加する

### 問題3: T_事業所職員の氏名カラム設計不整合

**症状**: T_事業所職員は `氏名` 1カラムにフルネーム（例: "野口　健太"）を格納。一方、T_会員は `姓` + `名` の2カラムに分割。テーブル間で名前の持ち方が不統一。

**原因分析**:
- T_事業所職員のスキーマ（`テーブル定義.T_事業所職員`）が元から `氏名` 単一カラム設計
- これは移行コードの問題ではなく、**スキーマ設計自体の問題**
- 検索、ソート、表示で姓名を分離する必要が生じるたびにアプリ側で `splitName_()` を呼ぶ必要がある

**ベストプラクティスとの比較**（Web検索結果より）:
- データベース設計の標準は「姓と名を別カラムに分割する」こと
- 日本語名は漢字・フリガナの両方で姓名分離が推奨される
- 単一氏名カラムは表示用としては便利だが、構造化データとしては不十分

**修正方針**:
1. T_事業所職員に `姓`, `名`, `セイ`, `メイ` の4カラムを追加する（T_会員と統一）
2. 既存の `氏名` カラムは後方互換のため当面保持し、`姓`+`名` から自動生成する運用に切り替える
3. `フリガナ` も同様に `セイ`+`メイ` に分離する
4. `テーブル定義.T_事業所職員` と `docs/03_DATA_MODEL.md` を同時更新する

### 問題4: ソース↔ターゲット突合レポートの不在

**症状**: 移行後にソースの全326行とターゲットの全レコードを1行ずつ突合するレポートが生成されていない。

**原因分析**:
- `verifyMigration_()` は件数チェックと参照整合性チェックのみ
- ソース行番号↔会員IDの対応表がない
- どの行が取りこぼされたかを事後追跡する手段がない

**ベストプラクティスとの比較**（Web検索結果より）:
- データ移行ではソースとターゲットのレコード数比較だけでなく、**行レベルの突合レポート**が必須
- フェーズ完了後に100%の正確性を確認するまで次のフェーズに進まない
- 完全性（Completeness）、一意性（Uniqueness）、妥当性（Validity）のスコアカードを作成する

**修正方針**:
1. ソース行番号と移行先会員ID/職員IDの対応表を `_MIGRATION_MAP` シートに出力する
2. スキップされた行の理由一覧を `_MIGRATION_SKIPPED` シートに出力する
3. ソース行数 = 移行行数 + スキップ行数 を自動検証する

---

## 3. 管理者紐付けの未完了タスク

**依頼内容**: `k.noguchi@uguisunosato.or.jp`（Googleアカウント名: 野口健太）を会員名「野口　健太」に紐付け、MASTER権限を付与する。

**事実関係**:
- 「野口　健太」は**ソース名簿（★会員名簿 2025年度シート）にデータとして存在する**
- 2026-03-24 実行結果では移行後のDBに「野口」が存在しなかった
- 2026-03-25 修正版 dry-run では「野口　健太」を含む `変更` 行が採用対象として `_MIGRATION_MAP` に出力される
- `T_管理者Googleホワイトリスト` には `k.noguchi@uguisunosato.or.jp` が MASTER 権限で既に登録済み
- 2026-03-25 live 確認では `紐付け会員ID = 4539021` で紐付け済み。管理コンソール表示も機能している

**対応手順**:
1. 修正版 dry-run の結果を確認し、野口 健太が `_MIGRATION_MAP` に出力されていることを確認する
2. `T_管理者Googleホワイトリスト` の紐付け先会員 `4539021` が現行代表者スナップショットを保持していることを spot check する
3. MASTER権限は既に設定済みなので変更不要
5. 紐付け設定は管理コンソールの「システム権限」画面からも可能（MCPまたは手動）

---

## 4. 修正移行の推奨手順

### Step 1: 現行データのロールバック
```bash
npx clasp run rollbackMigration_ --params '["_BAK_20260324_132929"]'
```

### Step 2: 移行コードの修正
1. 空行スキップ条件を修正（D列空でもL列に氏名があれば処理）
2. E=変更行を一律スキップせず、単独レコードとして採用
3. `_MIGRATION_SUMMARY` / `_MIGRATION_MAP` / `_MIGRATION_SKIPPED` を出力
4. （任意）T_事業所職員スキーマの姓名分離

### Step 3: ドライラン → 突合確認 → 本番実行
```bash
npx clasp push --force
npx clasp run dryRunMigration        # ドライラン
# → 突合レポートの全行確認
npx clasp run executeMigration       # 本番実行
npx clasp run verifyMigration_       # 検証
```

### Step 4: 管理者紐付け
- 野口 健太の会員ID取得 → T_管理者Googleホワイトリスト更新

### Step 5: ドキュメント更新
- `HANDOVER.md`, `docs/03_DATA_MODEL.md` を移行結果に合わせて更新

---

## 5. 移行関数の所在

| 関数 | 行（概算） | 用途 |
|------|-----------|------|
| `readRosterSource_()` | 7540 | ソース読込（読み取り専用） |
| `migrateRoster2025_(options)` | 7710 | メイン移行（dryRun対応） |
| `backupBeforeMigration_()` | 7460 | バックアップ作成 |
| `clearMigrationTargets_()` | 7490 | ターゲット4テーブルクリア |
| `rollbackMigration_(suffix)` | 7510 | バックアップから復元 |
| `verifyMigration_()` | 8330 | 件数・整合性チェック |
| `dryRunMigration()` | 8420 | CLIエントリ（ドライラン） |
| `executeMigration()` | 8425 | CLIエントリ（本番実行） |
| `splitName_()` | 7656 | 氏名→姓名分割 |
| `parseAddress_()` | 7612 | 住所パース |
| `isKanjiFurigana_()` | 7600 | フリガナ漢字判定（退会者検出） |

---

## 6. ソーススプレッドシートのカラムマップ

| 列 | ヘッダー | 用途 | 移行での使用 |
|----|----------|------|-------------|
| A | 2024年 | 2024年度会費 | T_年会費納入履歴 |
| B | 2025年・個 | 2025年度個人会費 | T_年会費納入履歴 |
| C | 2025年・事 | 2025年度事業所会費 | T_年会費納入履歴 |
| D | 会員 | 会員種別（個人/事業所） | 分類キー **← 空行スキップの原因** |
| E | （入会/退会/変更） | 状態イベント | 入会日・退会判定 **← 変更行スキップの原因** |
| F | 備考 | 日付（入会日/退会処理日） | 入会日・退会処理日 |
| G | LINE | LINE登録 | 未使用 |
| H | 発送 | 発送方法 | 発送方法コード（ほぼ空） |
| I | 郵送先 | 自宅/所属先 | 郵送先区分コード・代表者判定 |
| J | ルアド | メールアドレス | 代表メール |
| K | 勤務先 | 勤務先名 | 事業所グルーピングキー |
| L | 氏名 | フルネーム | T_会員.姓/名, T_事業所職員.氏名 |
| M | CM番号 | 介護支援専門員番号 | ログインID・CM番号 |
| N | フリガナ | カタカナ（退会者は漢字） | セイ/メイ・退会判定 |
| O | 郵便番号 | | 郵便番号 |
| P | 連絡先住所 | | 住所（都道府県推定あり） |
| Q | 住所② | | 住所補足 |
| R | （数式列） | | スキップ |
| S | 連絡先電話番号 | | 電話番号 |
| T | 連絡先FAX | | FAX番号 |
| U | その他連絡先 | | 携帯電話番号 |

---

## 7. 参考資料（Web検索に基づくベストプラクティス）

### データ移行の品質基準
- ソースとターゲットのレコード数比較だけでなく、**行レベルの突合**が必須
- 移行完了前に100%の正確性確認を義務付ける（フェーズ完了基準）
- 完全性（Completeness）、一意性（Uniqueness）、妥当性（Validity）のスコアカードを作成する

### 日本語名のDB設計
- 姓と名は別カラムに分割するのが標準
- 漢字表記とフリガナ（カタカナ/ひらがな）の両方で姓名分離を推奨
- 一つの氏名カラムは表示用には便利だが、検索・ソート・分析には不十分

### GAS移行のべき等性
- 各実行にユニークなrunIdを付与し、ログとレポートを紐付ける
- チェックポイントと状態永続化で中断・再開に対応する
- 書き込み前にoperationIdでマーキングし、重複実行を防止する

Sources:
- [10 Actionable Best Practices for Data Migration in 2026](https://smoothsheet.com/blog/best-practices-for-data-migration/)
- [Data Migration Best Practices: Your Ultimate Guide for 2026](https://medium.com/@kanerika/data-migration-best-practices-your-ultimate-guide-for-2026-7cbd5594d92e)
- [What Are the Data Migration Validation Best Practices?](https://www.cloudficient.com/blog/what-are-the-data-migration-validation-best-practices)
- [Data Migration Testing: A Complete Guide](https://datalark.com/blog/data-migration-testing-guide)
- [Why should a database design split the name of a person in different columns?](https://www.quora.com/Why-should-a-database-design-split-the-name-of-a-person-in-different-columns)

---

## 8. 正本ドキュメントの更新状態

| ドキュメント | v128反映状態 | 修正移行後に再更新が必要か |
|-------------|-------------|-------------------------|
| `HANDOVER.md` | v128記載済み | はい（移行結果の数値更新） |
| `docs/03_DATA_MODEL.md` | 退会処理日追加済み | はい（姓名分離する場合） |
| `GLOBAL_GROUND_RULES/docs/AI_RULES/05_PROJECT_RULES_HIRAKATA.md` | DB_SCHEMA_VERSION更新済み | はい（スキーマ変更する場合） |

---

## 9. 結論

v128 の移行は、2026-03-24 実行結果では **`変更` 行未採用により件数不足** だったが、2026-03-25 に runId `20260325T120805-35e3927e` で再移行し、その後 `repairRosterMigrationDataJson` で個人会員 158 件の `介護支援専門員番号` を補正した。現在は件数・参照整合性・固定URL動作は正常だが、`_MIGRATION_*` 監査シートが live DB に現存せず、`reconcileMigrationWithSource` は未収束である。次担当者は以下の優先順で対応すること:

1. **最優先**: `dryRunMigration()` を再実行し、`_MIGRATION_SUMMARY` / `_MIGRATION_MAP` / `_MIGRATION_SKIPPED` を live DB に再生成できるか確認する
2. **高優先**: `reconcileMigrationWithSource` を再実行し、`mappedRowCount > 0` かつ `ok=true` まで provenance を収束させる
3. **中優先**: T_事業所職員の姓名分離スキーマ変更
4. **中優先**: `_CREDENTIALS_TEMP` の再生成要否と認証通知手順を整理する
