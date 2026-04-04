# 仕様監査レポート: 管理コンソール表示異常と仕様乖離

作成日: 2026-04-04
対象バージョン: v168
ステータス: `要対応` (2件 CRITICAL / 2件 SPEC CHANGE / 1件 UNDEFINED)

---

## 0. 概要

ユーザー報告:
- 管理コンソールで引っ張ってくるデータが非常に少ない
- スプレッドシート上はデータがある
- 管理権限に紐づく会員 ID がおかしい
- 「以前の仕様が勝手に変更されている」

本監査では、コード・DB・ドキュメントを横断調査し、以下 5 件の問題を確認した。

---

## 1. [CRITICAL-1] seedDemoData が本番 DB を上書きした

### 発生状況

前セッション（2026-04-03）の Playwright UI テスト準備で `npx clasp run seedDemoData` を実行した。
この関数は以下のテーブルを **全削除してデモデータで置き換える**。

```
T_会員
T_事業所職員
T_認証アカウント
T_ログイン履歴
T_管理者Googleホワイトリスト   ← ここが問題
T_研修
T_研修申込
T_年会費納入履歴
```

### 影響

| テーブル | 変更前 | 変更後 |
|---------|--------|--------|
| T_会員 | 本番会員データ（複数） | デモ 3 件（12345678, 87654321, 99999999） |
| T_管理者Googleホワイトリスト | 本番ホワイトリスト | WL-001: k.noguchi → 紐付け会員ID=`99999999` |
| T_事業所職員 | 本番職員データ | S1(代表)/S2(管理者)/S3(一般) のデモ 3 件 |

「管理権限に紐づく会員 ID がおかしい」の直接原因。

### ドキュメント上の問題

`seedDemoData` がどのテーブルを削除するか記載したドキュメントが **存在しない**。
`docs/04_DB_OPERATION_RUNBOOK.md` にも警告なし。

### 対応方針

1. **データ復旧**: スプレッドシートの版歴（Google スプレッドシートの変更履歴）から本番データを復元する。
2. **ホワイトリスト再設定**: 管理コンソール「システム権限」で k.noguchi のホワイトリストを正しい本番会員 ID に更新する。
3. **ドキュメント整備**: `docs/04_DB_OPERATION_RUNBOOK.md` に `seedDemoData` は本番 DB 破壊的操作である旨を明記する（→ CRITICAL-2 文書化タスク）。
4. **コード側の防護**: `seedDemoData` の冒頭に本番 DB チェック（`DB_SPREADSHEET_ID_FIXED` と既知のデモ用 ID との照合）または実行確認プロンプトを追加することを検討する。

---

## 2. [CRITICAL-2] seedDemoData の破壊的スコープが未定義・未文書

### 問題

`backend/Code.gs` の `seedDemoData()` 関数（約 1207 行目）は本番運用 DB に直接接続して 8 テーブルを全削除する破壊的操作だが、以下の箇所にその旨が記載されていない。

- `docs/04_DB_OPERATION_RUNBOOK.md`
- `docs/20_NEXT_INSTRUCTIONS_FOR_CLAUDECODE_2026-03-19.md`
- `HANDOVER.md`
- 関数コード内のコメント

また、権限チェックにより `seedDemoData` は `MASTER` 権限を持つ管理者のみ実行可能（Code.gs 行 709）だが、これがデモ・テスト専用であることも明示されていない。

### 対応方針

`docs/04_DB_OPERATION_RUNBOOK.md` に以下のセクションを追加する：

```
## 危険操作リスト

### seedDemoData
- 対象: 本番 DB（DB_SPREADSHEET_ID_FIXED）
- 動作: 8 テーブルを全削除してデモデータに置き換える（ロールバック不可）
- 用途: 開発・テスト時のみ（本番環境での実行禁止）
- 保護: 実行前に必ずスプレッドシートの版歴をバックアップすること
```

---

## 3. [SPEC CHANGE-1] 管理コンソールの会計年度フィルタ初期値が無断変更

### 変更内容

コミット `2c3a223`（2026-03-30）で `src/App.tsx` の変更：

```diff
- const [memberListFiscalYearFilter, setMemberListFiscalYearFilter] = useState<string>('ALL');
+ const [memberListFiscalYearFilter, setMemberListFiscalYearFilter] = useState<string>(DEFAULT_MEMBER_FISCAL_YEAR_FILTER);
```

`DEFAULT_MEMBER_FISCAL_YEAR_FILTER = String(getFiscalYearForDate(new Date()))` → 本日は 2026-04-04 なので `'2026'`。

### フィルタロジック（src/App.tsx 行 476-486）

```ts
if (memberListFiscalYearFilter !== 'ALL') {
  const fy = Number(memberListFiscalYearFilter);
  const fyStart = new Date(fy, 3, 1);      // 4月1日
  const fyEnd = new Date(fy + 1, 2, 31);   // 翌3月31日
  const joined = member.joinedDate ? new Date(member.joinedDate) : null;
  if (!joined || isNaN(joined.getTime()) || joined > fyEnd) return false;
  // 退会済みで退会日が年度開始前なら除外
  if (member.status === 'WITHDRAWN' && member.withdrawnDate) {
    const wd = new Date(member.withdrawnDate);
    if (!isNaN(wd.getTime()) && wd < fyStart) return false;
  }
}
```

フィルタの意味: **「指定年度終了日より前に入会した、かつ指定年度開始前に退会していない会員」を表示**。
すなわち FY2026（2026-04-01〜2027-03-31）なら「2027-03-31 以前に入会した全員（ただし 2026-04-01 前に退会済みは除外）」。

→ 2024 年入会メンバーも含まれる。データ隠れの原因ではないが、**ダッシュボード数値の計算方法が変わった**（下記）。

### ダッシュボード数値の変化

コミット前: `renderAdminPage` はバックエンドの `adminDashboardData` の数値をそのまま表示（全アクティブ会員ベース）。
コミット後: `filteredDashboardMetrics`（フロントエンド計算）を使用。フィルタ結果に連動する。

| 状況 | 変更前の表示 | 変更後の表示 |
|------|------------|------------|
| フィルタなし（初期状態） | バックエンド集計値（全アクティブ） | FY2026 フィルタ適用後の件数 |
| ステータスフィルタ = ACTIVE | バックエンド集計値 | フロントフィルタ適用後 |

### ドキュメント上の問題

- `docs/02_ARCHITECTURE.md` の管理コンソール構成に会計年度フィルタの仕様が**未記載**
- `docs/01_PRD.md` にも未記載
- この変更が仕様として意図されたものか、バグかが判断できない状態

### 確認事項

この変更は意図した仕様変更か否か？（ユーザーへの確認が必要）
- **仕様変更が意図したものの場合**: `docs/02_ARCHITECTURE.md` に会計年度フィルタの動作を追記する
- **意図しない変更の場合**: デフォルト値を `'ALL'` に戻し、コミットを差し戻す

---

## 4. [SPEC CHANGE-2] GLOBAL_GROUND_RULES のプロジェクトルールが v166 のまま

### 問題

`GLOBAL_GROUND_RULES/docs/AI_RULES/05_PROJECT_RULES_HIRAKATA.md` の「Current Operating Assumptions」が：

```
Production is `v166` and both fixed deployments are at `@166`.
```

実際の本番は `v168` / `@168`。

### 対応

`05_PROJECT_RULES_HIRAKATA.md` の Operating Assumptions セクションを v168 に更新する（→ 本ドキュメント作成後すぐに修正）。

---

## 5. [UNDEFINED] 管理コンソール会計年度フィルタ動作が仕様書に未定義

### 問題

`src/App.tsx` に会計年度フィルタ UI が存在するが、以下の仕様が未記載：

| 項目 | 仕様書 | 現状 |
|------|--------|------|
| デフォルト表示年度 | 未定義 | コードで "現在年度" に固定 |
| フィルタの意味（入会年度 vs 在籍年度） | 未定義 | 「退会前かつ入会日が指定年度以前」 |
| ダッシュボード数値とフィルタの連動 | 未定義 | フロントエンド再計算で連動 |
| 「全件表示」に戻す手段 | 未定義 | ドロップダウンで 'ALL' を選択 |

### 対応

`docs/02_ARCHITECTURE.md` §2.1 管理コンソール構成に会計年度フィルタの仕様を追記する（ただし #3 の確認後に行う）。

---

## 6. 対応優先度

| 優先度 | 番号 | 作業 | 担当 |
|--------|------|------|------|
| 今すぐ | CRITICAL-1 | スプレッドシート版歴から本番データ復元 | **ユーザー（手動）** |
| 今すぐ | CRITICAL-1 | ホワイトリスト `紐付け会員ID` を本番の正しい値に修正 | **ユーザー確認 → ClaudeCode 実行** |
| 今すぐ | SPEC CHANGE-2 | `05_PROJECT_RULES_HIRAKATA.md` の v166 → v168 修正 | ClaudeCode |
| 確認後 | SPEC CHANGE-1 | FY フィルタ初期値を `'ALL'` に戻すか仕様化するか決める | **ユーザー判断** |
| 確認後 | CRITICAL-2 | `docs/04_DB_OPERATION_RUNBOOK.md` に seedDemoData 警告追記 | ClaudeCode |
| 確認後 | UNDEFINED | `docs/02_ARCHITECTURE.md` に FY フィルタ仕様追記 | ClaudeCode |

---

## 7. ユーザーへの確認事項

以下の 2 点を確認してください。

### Q1（CRITICAL-1 対応）
スプレッドシート `1GVlIzOG1Tsqw8fBXgZ__c8u4oMu-4_WCf0H3aVLESKs` の変更履歴（Google スプレッドシート → ファイル → 変更履歴）に、2026-04-03 以前のバックアップが残っていますか？

### Q2（SPEC CHANGE-1 対応）
管理コンソールの会員一覧・ダッシュボードの初期表示は、以下のどちらが正しい仕様ですか？

- **A**: デフォルト「全件表示 (ALL)」— 以前の動作（コミット `2c3a223` 以前）
- **B**: デフォルト「現在の会計年度で絞り込み」— 現在の動作

---

## 8. 参照ファイル

| ファイル | 関連箇所 |
|---------|---------|
| `backend/Code.gs` | `seedDemoData()` 行 1207、`clearTableData_` 呼び出し 行 1212-1221 |
| `backend/Code.gs` | `getAdminDashboardData_()` 行 2821 — 全会員を返す（フィルタなし） |
| `src/App.tsx` | `memberListFiscalYearFilter` 行 123、`filteredAdminMemberRows` 行 471-494 |
| `src/App.tsx` | `filteredDashboardMetrics` 行 519+、`renderAdminPage` 行 1587 |
| `GLOBAL_GROUND_RULES/docs/AI_RULES/05_PROJECT_RULES_HIRAKATA.md` | Current Operating Assumptions（v166 と記載） |
