# 249 設計: 会員系削除の cascade アーカイブ（単一化・a1 モデル）

作成日: **2026-07-02**
対象: 枚方市介護支援専門員連絡協議会 会員システム（GAS + Google Spreadsheet DB）
関連: `docs/248`（第三者評価・§2-A リレーション整合性）／`docs/03_DATA_MODEL.md`（スキーマ正本）／`docs/04_DB_OPERATION_RUNBOOK.md`
状態: **設計（実装前・要承認）**。破壊的操作を含むため実装・本番反映は明示承認と完全バックアップを前提とする（`AGENTS.md §4.3/§6`）。

> 本書は `docs/248` の High/Med 所見（Cascade・孤児・`_archive` 未活用）に対する恒久設計。**まず設計を確定し、実装は別途承認後**。

---

## 1. 目的

会員（および紐づく職員）を**削除**した時点で、その会員系関連レコードを live テーブルから除去し、**削除ログ＋各 `_archive` テーブルという単一の場所に集約**する（＝「削除＝単一化」）。これにより:

- live テーブルは常に「有効データのみ」→ フィルタ漏れ由来の集計バグを構造的に封じる
- 孤児レコード（削除済み会員を参照する子行）を発生させない
- 監査（誰が・いつ・何を削除したか）と復元を単一経路で担保する

---

## 2. 用語・確定した設計前提

| 用語 | 定義 |
|---|---|
| **退会（withdrawal）** | 会員ではなくなるが**履歴は保持**。live に残し状態=WITHDRAWN。**cascade 削除しない**。既存 `withdrawMember`/会計年度ステータス判定の領域 |
| **削除（deletion）** | 実体を消す（誤登録・テストデータ・本人消去要請）。MASTER 削除コンソール（`executeDeleteMember_`）経由。**本書の対象** |
| **単一化（a1）** | 削除時、対象会員系の子行を live から除去し、各 `_archive` に構造保存＋削除ログに集約 |

**確定事項（ユーザー承認済）**:
1. 削除時に単一スナップショット／アーカイブへ集約してよい（#1）。
2. 退避方式は **a1（各テーブルに `_archive` を設け構造保存）** を採用。
3. スコープは**会員系のみ**（M_ マスタ〈役職・組織・支払種別等〉は対象外）。
4. **削除された会員の過去実績（研修受講・年会費等）は集計から消える**（＝真の削除。履歴を残したい場合は「退会」で扱う）。
5. **T_ログイン履歴は物理 purge**（`_archive` に残さない。削除アカウントのログイン痕跡は不要・PII 最小化）。
6. **復元は会員単位のみ**。各 `_archive` 行に **`削除バッチID`（削除ログの `ログID`）** を刻み「同一 `削除バッチID` の全行を戻す」でアトミック復元。
7. **バックフィル移行は任意**。先に read-only 診断で現 DB の負債量（soft-delete 済み会員・孤児件数）を実測し、整合が取れ有益なら実施。現 DB 状態で困難なら**無理に行わない**。

---

## 3. 現状実装の矛盾点・問題点（実コード裏取り・2026-07-02）

> `docs/248` の所見を実装レベルで精査した結果、**当初評価より深刻**であることが判明。以下は本設計で必ず解消する。

| # | 矛盾/問題 | 実体（裏取り） | 影響 |
|---|---|---|---|
| **C1** | **命名詐称**: `archive*ByIds_` は archive しない | `archiveMembersByIds_`(24130) / `archiveStaffsByIds_`(24164) / `archiveAuthAccountsForTargets_`(24198) / `archiveAdminWhitelistsByMemberIds_`(24230) は **live 行にフラグを立てる in-place soft delete** で、`_archive` へ**移動しない** | 「archive」を信じると誤解。`docs/248` V2 訂正も本事実で再訂正 |
| **C2** | `_archive` は実質常に空 | `_archive` に書込むのは自動3年移動 `moveWithdrawnRowsToArchive_`(24563) **のみ**で、これは build pruner 除外の dead code | アーカイブ機構が名目のみ |
| **C3** | **削除時の子処理が不完全（真の孤児）** | `executeDeleteMember_` の snapshot 収集(24367-24378)は 会員/職員/認証/whitelist/ログイン履歴/年会費/研修申込 のみ。実際の soft delete は 会員/職員/認証/whitelist の4つだけ（24401-24404）。**年会費/研修申込は snapshot されるが live 無処理／役員・請求・振込口座・支払い・変更申請は snapshot すらされず完全放置** | 削除会員を指す 役員/請求/年会費/研修申込 等が live に残存＝集計・参照解決が破綻 |
| **C4** | `_archive` 定義は2テーブルのみ | `テーブル定義['T_会員_archive']` / `['T_事業所職員_archive']` の2つだけ（741-742）。子テーブル用 `_archive` は未定義 | a1 実現には子テーブル分の `_archive` 追加が必要 |
| **C5** | build pruner の誤削除罠 | `feedback_build_pruning_bug`: トップレベル定義/リテラル内コメントに `_` 付き関数名を書くと public/member で `テーブル定義` ごと誤削除 | 新規 mover 関数・`_archive` 定義追加時に要注意 |
| **C6** | `getOrCreateSheet_` ヘッダー欠落罠 | `feedback_getorcreatesheet_headerless_trap`: 新 `_archive` シートは列数0で作られ得る | ensure/normalize でヘッダー自己修復必須 |
| **C7** | 退会と削除の経路混同リスク | 退会(`withdrawMember`)は履歴保持が正。cascade 削除を誤って退会に適用すると履歴喪失 | cascade は削除コンソール限定に厳格化 |

---

## 4. 目標設計（a1: cascade アーカイブ）

### 4.1 対象テーブルと `_archive` マッピング

削除対象の会員ID集合 `M`、職員ID集合 `S`（M に属する職員）、認証ID集合 `A`（M/S に紐づく認証）を解決し、以下を live→`_archive` へ移動する。

| live テーブル | 一致条件 | 退避先 `_archive` | 状態 |
|---|---|---|---|
| T_会員 | 会員ID∈M | T_会員_archive | 既存 |
| T_事業所職員 | 職員ID∈S ∨ 会員ID∈M | T_事業所職員_archive | 既存 |
| T_認証アカウント | 会員ID∈M ∨ 職員ID∈S | **T_認証アカウント_archive** | 新規 |
| T_管理者Googleホワイトリスト | 紐付け会員ID∈M | **T_管理者Googleホワイトリスト_archive** | 新規 |
| T_研修申込 | 会員ID∈M ∨ 職員ID∈S | **T_研修申込_archive** | 新規 |
| T_年会費納入履歴 | 会員ID∈M | **T_年会費納入履歴_archive** | 新規 |
| T_年会費更新履歴 | 会員ID∈M | **T_年会費更新履歴_archive** | 新規 |
| T_役員 | 会員ID∈M ∨ 職員ID∈S | **T_役員_archive** | 新規 |
| T_振込口座 | 会員ID∈M ∨ 職員ID∈S | **T_振込口座_archive** | 新規 |
| T_支払い | 会員ID∈M | **T_支払い_archive** | 新規 |
| T_支払い明細 | 支払いID∈(削除対象支払い) | **T_支払い明細_archive** | 新規 |
| T_請求 | 会員ID∈M ∨ 職員ID∈S | **T_請求_archive** | 新規 |
| T_変更申請 | 会員ID∈M | **T_変更申請_archive** | 新規 |

**対象外（会員系でない／別扱い）**:
- **T_ログイン履歴**: 高volume・低価値・PII。**物理 purge（確定）**（削除対象認証IDの履歴を live から削除し `_archive` に残さない）。
- **T_外部申込者**: 会員に紐づかない独立実体。会員削除の cascade 対象にしない（外部申込者自体の削除は別機能）。
- M_ マスタ、T_システム設定、T_権限ロール、T_メールテンプレート、T_監査ログ、T_共有メモ、T_LINE投稿依頼: 会員実体ではないため対象外。

### 4.2 共通ムーバ（単一実装・DRY）

```
// 疑似コード（実装は gas-src。命名は _archive 詐称を避け「move」を用いる）
function moveRowsToArchiveByMatch_(ss, srcName, dstName, matchFn, nowIso) {
  // 1. src 読取 → matchFn で対象行を分離
  // 2. 対象行に アーカイブID(UUID)/削除バッチID(=削除ログの ログID)/アーカイブ日時 を付与し dst へ append（ヘッダー整合・欠落自己修復）
  // 3. src を「非対象行のみ」で書き直し（＝live から除去）
  // 4. lock/バッチ/冪等（既に dst に同アーカイブ元キーがあればスキップ）
  // 5. 移動件数を返す
}
```

- `deleteWithCascade_(targets)` が 4.1 の各テーブルに対して `moveRowsToArchiveByMatch_` を呼ぶ**単一オーケストレータ**。
- **削除ログ**（T_削除ログ）は従来どおり1件の JSON スナップショット＋`ログID`。復元の**インデックス**とし、実データは各 `_archive` を正本とする。
- 既存の `archive*ByIds_`（in-place soft delete＝C1）は**廃止/置換**（`@deprecated` 後に撤去）。`executeDeleteMember_` は `deleteWithCascade_` を呼ぶ形に改修。

### 4.3 復元（undo）

- `restoreDeletedMember_(logId)`: 各 `_archive` の **`削除バッチID == logId`** の行を live へ戻す（アーカイブ3列を落として再挿入）。会員単位でアトミック。
- 削除は稀・MASTER 限定のため、復元は operator 実行の editor 関数（`restoreDeletedMember_LOG` ラッパー）で提供（`feedback_editor_run_no_args` 準拠）。

### 4.4 退会（withdrawal）との厳格な分離

- `withdrawMember` / `scheduleWithdrawMember` は**従来どおり in-place**（状態=WITHDRAWN、履歴保持、cascade しない）。
- cascade アーカイブは**削除コンソール（MASTER）専用**。退会フローからは絶対に呼ばない。

---

## 5. スキーマ・ビルド変更

1. `gas-src/Code.full.gs` の `テーブル定義` に §4.1 の新規 `_archive` を追加。アーカイブ列は **`.slice().concat(['アーカイブID','削除バッチID','アーカイブ日時'])`**（既存2本〈会員/職員〉にも `削除バッチID` を追加しスキーマ統一。`normalizeTableColumns_` の name-based shift で既存の空アーカイブは温存）。**C5 回避**: 追加時、リテラル内コメントに `_` 付き関数名を書かない。
2. `ensureTableSheetsExist_` / `normalizeTableColumns_` に新 `_archive` を登録し、**ヘッダー自己修復**を保証（C6 回避）。
3. `DB_SCHEMA_VERSION` bump → 次回 admin login で migrate。
4. `docs/er-metadata.json` に新 `_archive` テーブルとリレーション（各 live → `_archive` の「アーカイブ元」関係）を追記 → `npm run build:docs-portal`（generate-er）→ `npm run test:er-sync` PASS を同コミットに含める（`AGENTS §4.6`）。
5. **3-split**: 削除コンソールは admin(MASTER) 機能。cascade/mover は admin 生成物にのみ必要。build 後、public/member 生成物への意図しない混入・`テーブル定義` 欠落が無いことを grep 確認（`AGENTS §5.5`）。

---

## 6. テスト計画（E2E 回帰・AGENTS §5）

- **backend dryRun（実 DB・非破壊で検証→後片付け）** `dryRunDeleteCascade_LOG`:
  1. テスト会員＋子レコード（研修申込/年会費/役員/請求/振込口座/変更申請/認証/whitelist）を生成
  2. `deleteWithCascade_` 実行
  3. 検証: live 各テーブルに当該行が**残っていない**／各 `_archive` に移動済／削除ログに1件／**孤児ゼロ**（他テーブルに当該会員IDの live 参照が無い）
  4. `restoreDeletedMember_` で復元 → live に戻り `_archive` から消える
  5. テスト行を物理 cleanup（`DRYRUN_` prefix sweep）
- unit: `moveRowsToArchiveByMatch_` の分離・冪等・ヘッダー整合を純ロジックで（可能な範囲）
- `test:er-sync`（新 `_archive` とのドリフト）／prerelease 全ゲート PASS
- 退会フローが cascade を**呼ばない**ことの回帰確認

---

## 7. 未決事項・要確認

### 確定（2026-07-02・ユーザー承認済）
1. ✅ **T_ログイン履歴 = 物理 purge**（`_archive` に残さない）。
2. ✅ **復元 = 会員単位のみ**＋各 `_archive` に **`削除バッチID`（ログID）** を刻む。
3. ✅ **バックフィル移行 = 任意**。先に read-only 診断で負債量を実測 → 整合が取れ有益なら実施。現 DB 状態で困難なら**実施しない**（無理にしない）。

### 残（実装時に対応）
4. **支払い明細**の親子（支払い→明細）の移動順序と孤児防止（親を先に集合解決）。
5. 本設計の**実装・本番反映は破壊的**（live からの行除去）につき、**完全バックアップ（スプレッドシート版歴）＋明示承認**を実装着手前に取得（`AGENTS §4.3/§6`）。
6. **実装の第一歩は read-only 診断関数**（`diagnoseMemberDeleteDebt_LOG`: soft-delete 済み会員数・テーブル別孤児件数を集計）。非破壊なので先行実装可。結果でバックフィル要否を判断。

---

## 8. 参照

- `docs/248_THIRD_PARTY_EVALUATION_2026-07-01.md` §2-A（本設計の起点）
- `docs/03_DATA_MODEL.md` §4.10（退会会員アーカイブ・現行記述）／`docs/er-metadata.json`
- `docs/04_DB_OPERATION_RUNBOOK.md`（DB 操作・migration）
- MEMORY: `feedback_build_pruning_bug` / `feedback_getorcreatesheet_headerless_trap` / `project_member_archive_model`
- `AGENTS.md` §4.3（破壊的操作）／§4.6（ドキュメント/ER 同期）／§5（完了条件・E2E）／§6（承認）

---

**作成**: Claude Code（実コード裏取り）｜**次アクション**: §7 の未決確認 → 実装承認 → `deleteWithCascade_` 実装
